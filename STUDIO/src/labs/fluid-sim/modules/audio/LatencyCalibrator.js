// LatencyCalibrator — measures the audio-to-microphone round-trip lag so the
// AudioBus can offset beat/onset events to match what the user hears.
//
// Strategy: play N short clicks via a dedicated AudioContext.destination at
// known wall-clock times, simultaneously capture the mic stream; in the mic
// buffer find peaks closest to each expected time; average the offset.
//
// Usage:
//   const calibrator = new LatencyCalibrator();
//   const offsetMs = await calibrator.run({ beats: 4, bpm: 120 });
//   config.AUDIO_LATENCY_MS = offsetMs;
//
// Requires an active microphone stream (will request permission if needed).

const CLICK_FREQ = 1500;          // a 1.5 kHz tick is easy to detect
const CLICK_DURATION_S = 0.04;    // 40 ms

export class LatencyCalibrator {
    constructor() {
        this.audioCtx = null;
        this.mediaStream = null;
        this.analyser = null;
        this.cancelled = false;
    }

    async run({ beats = 4, bpm = 120, onProgress = null } = {}) {
        this.cancelled = false;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.audioCtx = ctx;
        const beatInterval = 60 / bpm;
        const totalDuration = beats * beatInterval + 0.5;

        // Mic capture.
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
            });
        } catch (err) {
            await ctx.close();
            throw new Error(`Mic access denied: ${err.message || err}`);
        }
        this.mediaStream = stream;

        const micSrc = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0;
        micSrc.connect(analyser);
        this.analyser = analyser;

        // Schedule the clicks.
        const startAt = ctx.currentTime + 0.2;
        const clickTimes = [];
        for (let i = 0; i < beats; i++) {
            const at = startAt + i * beatInterval;
            scheduleClick(ctx, at);
            clickTimes.push(at);
        }

        // Capture mic envelope samples timestamped against ctx.currentTime.
        const samples = [];   // [{ t, level }]
        const sampleInterval = 1 / 240;   // 240 Hz envelope
        const startCapture = ctx.currentTime;
        const endCapture = startAt + (beats - 1) * beatInterval + 0.4;

        await new Promise((resolve, reject) => {
            const data = new Uint8Array(analyser.fftSize);
            const tick = () => {
                if (this.cancelled) { resolve(); return; }
                analyser.getByteTimeDomainData(data);
                let max = 0;
                for (let i = 0; i < data.length; i++) {
                    const v = Math.abs(data[i] - 128);
                    if (v > max) max = v;
                }
                samples.push({ t: ctx.currentTime, level: max });
                onProgress?.((ctx.currentTime - startCapture) / totalDuration);
                if (ctx.currentTime >= endCapture) { resolve(); return; }
                setTimeout(tick, sampleInterval * 1000);
            };
            tick();
            setTimeout(() => reject(new Error('timeout')), (totalDuration + 1) * 1000);
        }).catch(() => { /* allow timeout to be silent */ });

        // Find peaks in the envelope and match to clickTimes.
        const peaks = findPeaks(samples, 32);
        const offsets = matchOffsets(peaks, clickTimes);

        // Tear down.
        try { stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
        try { await ctx.close(); } catch (_) {}
        this.audioCtx = null;
        this.mediaStream = null;
        this.analyser = null;

        if (offsets.length === 0) {
            throw new Error('No clicks detected in mic stream — increase volume and try again.');
        }
        const avgSec = offsets.reduce((a, b) => a + b, 0) / offsets.length;
        const ms = Math.round(avgSec * 1000);
        return Math.max(0, Math.min(500, ms));
    }

    cancel() {
        this.cancelled = true;
        try { this.mediaStream?.getTracks().forEach((t) => t.stop()); } catch (_) {}
        try { this.audioCtx?.close(); } catch (_) {}
    }
}

function scheduleClick(ctx, at) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = CLICK_FREQ;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.8, at + 0.002);
    gain.gain.linearRampToValueAtTime(0, at + CLICK_DURATION_S);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + CLICK_DURATION_S + 0.01);
}

function findPeaks(samples, minDistanceSamples) {
    const peaks = [];
    let lastPeak = -Infinity;
    let max = 0;
    for (const s of samples) max = Math.max(max, s.level);
    const threshold = Math.max(10, max * 0.45);
    for (let i = 1; i < samples.length - 1; i++) {
        const s = samples[i];
        if (s.level < threshold) continue;
        if (samples[i - 1].level > s.level || samples[i + 1].level > s.level) continue;
        if (i - lastPeak < minDistanceSamples) continue;
        peaks.push(s.t);
        lastPeak = i;
    }
    return peaks;
}

function matchOffsets(peakTimes, clickTimes) {
    // Greedy: each click matches its nearest peak that comes after it.
    const offsets = [];
    let pi = 0;
    for (const click of clickTimes) {
        while (pi < peakTimes.length && peakTimes[pi] < click) pi++;
        if (pi >= peakTimes.length) break;
        const peak = peakTimes[pi];
        const off = peak - click;
        if (off >= 0 && off < 0.5) offsets.push(off);
        pi++;
    }
    return offsets;
}
