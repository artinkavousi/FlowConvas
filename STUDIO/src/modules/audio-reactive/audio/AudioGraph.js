// AudioGraph — Web Audio plumbing for the v2 reactivity engine.
//
// Owns: AudioContext, source node (mic/file/tone/off), gain/mute, AnalyserNode.
// Does not own: feature extraction, beat tracking, modulation. Those live in
// FeatureExtractor / BeatTracker / ModulationMatrix.
//
// API
//   const g = new AudioGraph({ fftSize: 2048, smoothing: 0.72 });
//   await g.start('mic');            // 'mic' | 'file' | 'tone' | 'off'
//   await g.start('file', file);     // file source needs a File or URL
//   g.setGain(1.25);
//   g.setMuted(true);
//   g.getAnalyser();                 // for FeatureExtractor to pull frames
//   g.getSampleRate();               // Hz, for band cutoff math
//   await g.stop();

import { FEATURE_PROCESSOR_SOURCE } from './worklet/featureProcessorSource.js';

const DEFAULT_FFT = 2048;
const DEFAULT_SMOOTHING = 0.72;
let workletModuleUrl = null;   // lazy blob URL, shared across contexts

export class AudioGraph {
    constructor({ fftSize = DEFAULT_FFT, smoothing = DEFAULT_SMOOTHING } = {}) {
        this.fftSize = fftSize;
        this.smoothing = smoothing;

        this.context = null;
        this.analyser = null;
        this.sourceNode = null;
        this.sourceKind = 'off';
        this.gainNode = null;
        this.mediaStream = null;
        this.bufferSource = null;
        this.oscillator = null;
        this.fileBuffer = null;
        this.muted = false;
        this.gain = 1;
        this.state = 'idle'; // idle | starting | running | error
        this.lastError = '';
        this.listeners = new Map();
    }

    on(event, handler) {
        const list = this.listeners.get(event) || [];
        list.push(handler);
        this.listeners.set(event, list);
        return () => {
            const current = this.listeners.get(event);
            if (!current) return;
            const next = current.filter((h) => h !== handler);
            this.listeners.set(event, next);
        };
    }

    emit(event, payload) {
        const list = this.listeners.get(event);
        if (!list) return;
        for (const handler of list) {
            try { handler(payload); } catch (error) { console.warn('[AudioGraph] listener error', error); }
        }
    }

    isRunning() {
        return this.state === 'running';
    }

    getAnalyser() {
        return this.analyser;
    }

    getSampleRate() {
        return this.context?.sampleRate || 48000;
    }

    getState() {
        return {
            kind: this.sourceKind,
            state: this.state,
            sampleRate: this.getSampleRate(),
            fftSize: this.fftSize,
            muted: this.muted,
            gain: this.gain,
            lastError: this.lastError
        };
    }

    async ensureContext() {
        if (this.context) {
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }
            return;
        }
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) {
            throw new Error('Web Audio is not supported in this browser.');
        }
        this.context = new Ctor();
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = this.fftSize;
        this.analyser.smoothingTimeConstant = this.smoothing;
        this.gainNode = this.context.createGain();
        this.gainNode.gain.value = this.gain;

        // v2 signal chain:  source → gain → eqLow → eqMid → eqHigh → comp → analyser
        // Each EQ + the compressor can be bypassed independently with no node-graph rewiring
        // (we set gain to 0 dB / threshold to 0 dB, ratio 1, etc.).
        this.eqLow = this.context.createBiquadFilter();
        this.eqLow.type = 'lowshelf';   this.eqLow.frequency.value = 200;   this.eqLow.gain.value = 0;
        this.eqMid = this.context.createBiquadFilter();
        this.eqMid.type = 'peaking';    this.eqMid.frequency.value = 1000;  this.eqMid.Q.value = 0.8; this.eqMid.gain.value = 0;
        this.eqHigh = this.context.createBiquadFilter();
        this.eqHigh.type = 'highshelf'; this.eqHigh.frequency.value = 6000; this.eqHigh.gain.value = 0;
        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.value = 0; this.compressor.ratio.value = 1; // bypassed by default
        this.compressor.knee.value = 6; this.compressor.attack.value = 0.005; this.compressor.release.value = 0.1;
        this.compressorEnabled = false;

        this.gainNode.connect(this.eqLow);
        this.eqLow.connect(this.eqMid);
        this.eqMid.connect(this.eqHigh);
        this.eqHigh.connect(this.compressor);
        this.compressor.connect(this.analyser);
        // Note: analyser is intentionally NOT connected to destination —
        // we observe, we don't echo. File/tone sources route to destination
        // explicitly via a separate output gain node when needed.
    }

    /** Set pre-EQ band gains in dB. Pass null to leave unchanged. */
    setEQ({ low = null, mid = null, high = null } = {}) {
        if (!this.context) return;
        if (low  !== null) this.eqLow.gain.value  = clamp(low,  -24, 24);
        if (mid  !== null) this.eqMid.gain.value  = clamp(mid,  -24, 24);
        if (high !== null) this.eqHigh.gain.value = clamp(high, -24, 24);
    }

    /** Set compressor params. `enabled` toggles the comp by ratio + threshold. */
    setCompressor({ threshold = null, ratio = null, knee = null, attack = null, release = null, enabled = null } = {}) {
        if (!this.context) return;
        if (enabled !== null) {
            this.compressorEnabled = !!enabled;
            // When disabled, ratio=1 + threshold=0 makes the comp transparent.
            if (!this.compressorEnabled) {
                this.compressor.threshold.value = 0;
                this.compressor.ratio.value = 1;
                return;
            }
        }
        if (threshold !== null) this.compressor.threshold.value = clamp(threshold, -60, 0);
        if (ratio     !== null) this.compressor.ratio.value     = clamp(ratio, 1, 20);
        if (knee      !== null) this.compressor.knee.value      = clamp(knee, 0, 40);
        if (attack    !== null) this.compressor.attack.value    = clamp(attack, 0, 1);
        if (release   !== null) this.compressor.release.value   = clamp(release, 0, 1);
    }

    /**
     * Enable the AudioWorklet feature backend. Returns true on success,
     * false (and silently falls through to the main-thread analyser) if the
     * worklet isn't supported or fails to load.
     *
     * @param {(payload: {rms:number, peak:number, mags:Float32Array,
     *                    sampleRate:number, fftSize:number}) => void} onFrame
     */
    async enableWorklet(onFrame) {
        if (!this.context || typeof this.context.audioWorklet?.addModule !== 'function') {
            return false;
        }
        try {
            if (!workletModuleUrl) {
                const blob = new Blob([FEATURE_PROCESSOR_SOURCE], { type: 'application/javascript' });
                workletModuleUrl = URL.createObjectURL(blob);
            }
            await this.context.audioWorklet.addModule(workletModuleUrl);
            this.workletNode = new AudioWorkletNode(this.context, 'fluid-feature-processor', {
                numberOfInputs: 1, numberOfOutputs: 0,
                processorOptions: { fftSize: this.fftSize }
            });
            this.workletNode.port.onmessage = (event) => {
                if (typeof onFrame === 'function') onFrame(event.data);
            };
            // Tap the signal AFTER all processing (post-gain/EQ/compressor),
            // mirroring what the analyser sees.
            this.compressor?.connect(this.workletNode);
            this.workletEnabled = true;
            return true;
        } catch (error) {
            console.warn('[AudioGraph] AudioWorklet init failed; falling back:', error?.message || error);
            this.workletEnabled = false;
            return false;
        }
    }

    disableWorklet() {
        if (!this.workletNode) return;
        try { this.compressor?.disconnect(this.workletNode); } catch (_) {}
        try { this.workletNode.port.close?.(); } catch (_) {}
        this.workletNode = null;
        this.workletEnabled = false;
    }

    isWorkletEnabled() { return !!this.workletEnabled; }

    /** Returns current EQ + compressor snapshot for the GUI. */
    getProcessing() {
        if (!this.context) return null;
        return {
            eq: {
                low: this.eqLow.gain.value,
                mid: this.eqMid.gain.value,
                high: this.eqHigh.gain.value
            },
            compressor: {
                enabled: this.compressorEnabled,
                threshold: this.compressor.threshold.value,
                ratio: this.compressor.ratio.value,
                knee: this.compressor.knee.value,
                attack: this.compressor.attack.value,
                release: this.compressor.release.value
            }
        };
    }

    async start(kind, payload) {
        if (this.state === 'starting') {
            return;
        }
        this.state = 'starting';
        this.lastError = '';
        try {
            await this.ensureContext();
            await this.detachSource();

            if (kind === 'mic') {
                await this.attachMic();
            } else if (kind === 'file') {
                await this.attachFile(payload);
            } else if (kind === 'tone') {
                await this.attachTone(payload);
            } else {
                kind = 'off';
            }

            this.sourceKind = kind;
            this.state = kind === 'off' ? 'idle' : 'running';
            this.emit('source-changed', this.getState());
        } catch (error) {
            this.lastError = String(error?.message || error);
            this.state = 'error';
            this.sourceKind = 'off';
            this.emit('error', { error, state: this.getState() });
            throw error;
        }
    }

    async attachMic() {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('Microphone is unavailable. Use HTTPS or localhost.');
        }
        // AGC, echo cancellation, and noise suppression destroy transients —
        // we disable them so beat detection works against the actual signal.
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            },
            video: false
        });
        this.mediaStream = stream;
        const node = this.context.createMediaStreamSource(stream);
        node.connect(this.gainNode);
        this.sourceNode = node;
    }

    async attachFile(payload) {
        if (!payload) {
            throw new Error('File source requires a File, Blob, or URL.');
        }
        const arrayBuffer = await readAsArrayBuffer(payload);
        const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
        this.fileBuffer = audioBuffer;
        this.fileLoop = true;
        this.filePaused = false;
        this.fileStartedAtContextTime = this.context.currentTime;
        this.fileStartOffset = 0;
        await this._startFileBufferSource(this.fileStartOffset);
    }

    async _startFileBufferSource(offset) {
        if (!this.fileBuffer || !this.context) return;
        // Tear down any prior buffer source first (seek/loop changes).
        try { this.bufferSource?.stop(); } catch (_) {}
        try { this.bufferSource?.disconnect(); } catch (_) {}
        try { this.fileOutputGain?.disconnect(); } catch (_) {}
        const source = this.context.createBufferSource();
        source.buffer = this.fileBuffer;
        source.loop = !!this.fileLoop;
        const outGain = this.context.createGain();
        outGain.gain.value = this.muted ? 0 : 1;
        source.connect(this.gainNode);
        source.connect(outGain);
        outGain.connect(this.context.destination);
        source.start(0, Math.max(0, Math.min(offset, this.fileBuffer.duration)));
        this.fileStartedAtContextTime = this.context.currentTime;
        this.fileStartOffset = offset;
        this.filePaused = false;
        this.bufferSource = source;
        this.fileOutputGain = outGain;
        this.sourceNode = source;
    }

    /** Transport: pause / resume / seek / loop for file source. */
    pauseFile() {
        if (this.sourceKind !== 'file' || !this.bufferSource || this.filePaused) return;
        this.fileStartOffset = this.getFilePosition();
        try { this.bufferSource.stop(); } catch (_) {}
        this.bufferSource = null;
        this.filePaused = true;
    }

    async resumeFile() {
        if (this.sourceKind !== 'file' || !this.filePaused) return;
        await this._startFileBufferSource(this.fileStartOffset);
    }

    async seekFile(seconds) {
        if (this.sourceKind !== 'file' || !this.fileBuffer) return;
        await this._startFileBufferSource(seconds);
    }

    setFileLoop(loop) {
        this.fileLoop = !!loop;
        if (this.bufferSource) this.bufferSource.loop = this.fileLoop;
    }

    /** Returns the current playback position in seconds (0 if not playing). */
    getFilePosition() {
        if (this.sourceKind !== 'file' || !this.fileBuffer) return 0;
        if (this.filePaused) return this.fileStartOffset || 0;
        const elapsed = this.context.currentTime - (this.fileStartedAtContextTime || 0);
        const offset = (this.fileStartOffset || 0) + elapsed;
        return this.fileLoop ? offset % this.fileBuffer.duration : Math.min(offset, this.fileBuffer.duration);
    }

    /** Duration in seconds, or 0 when no file is loaded. */
    getFileDuration() {
        return this.fileBuffer?.duration || 0;
    }

    async attachTone(payload) {
        const freq = Number.isFinite(payload?.frequency) ? payload.frequency : 220;
        const type = payload?.type || 'sine';
        const osc = this.context.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(this.gainNode);
        osc.start();
        this.sourceNode = osc;
        this.oscillator = osc;
    }

    async detachSource() {
        try { this.bufferSource?.stop(); } catch (_) { /* not started */ }
        try { this.oscillator?.stop(); } catch (_) { /* not started */ }
        this.bufferSource = null;
        this.oscillator = null;
        if (this.fileOutputGain) {
            this.fileOutputGain.disconnect();
            this.fileOutputGain = null;
        }
        if (this.sourceNode) {
            try { this.sourceNode.disconnect(); } catch (_) { /* already disconnected */ }
            this.sourceNode = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
            this.mediaStream = null;
        }
    }

    async stop() {
        await this.detachSource();
        this.sourceKind = 'off';
        this.state = 'idle';
        this.emit('source-changed', this.getState());
    }

    async dispose() {
        await this.stop();
        try { this.analyser?.disconnect(); } catch (_) { /* nothing */ }
        try { this.gainNode?.disconnect(); } catch (_) { /* nothing */ }
        if (this.context && this.context.state !== 'closed') {
            try { await this.context.close(); } catch (_) { /* ignore */ }
        }
        this.context = null;
        this.analyser = null;
        this.gainNode = null;
    }

    setGain(value) {
        this.gain = Math.max(0, Math.min(8, value));
        if (this.gainNode) {
            this.gainNode.gain.value = this.gain;
        }
    }

    setMuted(muted) {
        this.muted = !!muted;
        if (this.fileOutputGain) {
            this.fileOutputGain.gain.value = this.muted ? 0 : 1;
        }
    }

    setSmoothing(value) {
        this.smoothing = Math.max(0, Math.min(0.99, value));
        if (this.analyser) {
            this.analyser.smoothingTimeConstant = this.smoothing;
        }
    }

    setFftSize(size) {
        const valid = [256, 512, 1024, 2048, 4096, 8192];
        const pick = valid.includes(size) ? size : DEFAULT_FFT;
        this.fftSize = pick;
        if (this.analyser) {
            this.analyser.fftSize = pick;
        }
    }
}

function clamp(value, lo, hi) {
    return value < lo ? lo : value > hi ? hi : value;
}

async function readAsArrayBuffer(payload) {
    if (payload instanceof ArrayBuffer) {
        return payload;
    }
    if (payload instanceof Blob || payload instanceof File) {
        return await payload.arrayBuffer();
    }
    if (typeof payload === 'string') {
        const response = await fetch(payload);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.status}`);
        }
        return await response.arrayBuffer();
    }
    throw new Error('Unsupported audio payload (expected File, Blob, ArrayBuffer, or URL).');
}
