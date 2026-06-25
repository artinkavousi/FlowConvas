// FalseEarthAudio.js
// Local Lab audio layer derived from False Earth AudioButton, CharacterAudio, BeamAudio, and Bgm.

export const falseEarthAudioDefaults = {
  assetRoot: '/labs/false-earth/audio',
  enabled: false,
  volume: 0.85,
  ambientFade: 0.08,
  footstepsEnabled: true,
  beamsEnabled: true,
};

const AMBIENT_TRACKS = [
  { id: 'grass_field', file: 'grass_field.mp3', volume: 1.5 },
  { id: 'noise', file: 'noise.m4a', volume: 0.1 },
];

const FOOTSTEP_FILES = ['fs_grass1.mp3', 'fs_grass2.mp3', 'fs_grass3.mp3', 'fs_grass4.mp3', 'fs_grass5.mp3'];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function createFalseEarthAudio(options = {}) {
  const state = { ...falseEarthAudioDefaults, ...options };
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const context = AudioContextCtor ? new AudioContextCtor() : null;
  const master = context?.createGain();
  if (master) {
    master.gain.value = 0;
    master.connect(context.destination);
  }

  const buffers = new Map();
  const ambient = new Map();
  let loading = null;
  let disposed = false;
  let stepTimer = 0;

  async function loadBuffer(file) {
    if (!context) return null;
    if (buffers.has(file)) return buffers.get(file);
    const response = await fetch(`${state.assetRoot.replace(/\/$/, '')}/${file}`);
    const data = await response.arrayBuffer();
    const buffer = await context.decodeAudioData(data);
    buffers.set(file, buffer);
    return buffer;
  }

  async function loadAll() {
    if (!context) return;
    await Promise.all([
      ...AMBIENT_TRACKS.map((track) => loadBuffer(track.file)),
      ...FOOTSTEP_FILES.map((file) => loadBuffer(file)),
      loadBuffer('wave01.mp3'),
    ]);
  }

  function setMasterVolume(target) {
    if (!context || !master) return;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(target, now, state.ambientFade);
  }

  function startAmbient() {
    if (!context || !master) return;
    for (const track of AMBIENT_TRACKS) {
      if (ambient.has(track.id)) continue;
      const buffer = buffers.get(track.file);
      if (!buffer) continue;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.value = track.volume;
      source.connect(gain);
      gain.connect(master);
      source.start();
      ambient.set(track.id, { source, gain });
    }
  }

  function stopAmbient() {
    for (const item of ambient.values()) {
      try {
        item.source.stop();
      } catch {
        // Already stopped.
      }
      item.source.disconnect();
      item.gain.disconnect();
    }
    ambient.clear();
  }

  function playOneShot(file, { volume = 1, detuneRange = 0 } = {}) {
    if (!context || !master || !state.enabled) return;
    const buffer = buffers.get(file);
    if (!buffer) return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    if (detuneRange > 0) source.detune.value = (Math.random() - 0.5) * detuneRange;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(master);
    source.start();
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
  }

  function startTimers() {
    if (!stepTimer) {
      stepTimer = window.setInterval(() => {
        if (!state.enabled || !state.footstepsEnabled || !state.characterRun) return;
        playOneShot(randomItem(FOOTSTEP_FILES), { volume: 0.32, detuneRange: 200 });
      }, 390);
    }
  }

  async function activate() {
    if (!context || !master || disposed) return;
    if (context.state === 'suspended') await context.resume();
    loading ??= loadAll();
    await loading;
    if (!state.enabled || disposed) return;
    startAmbient();
    startTimers();
    setMasterVolume(state.volume);
  }

  function update(next = {}) {
    Object.assign(state, next);
    if (!context || !master) return;
    if (state.enabled) {
      activate().catch((error) => console.warn('False Earth audio activation failed', error));
    } else {
      setMasterVolume(0);
    }
  }

  update(options);

  return {
    update,
    playStep(volume = 0.32) {
      playOneShot(randomItem(FOOTSTEP_FILES), { volume, detuneRange: 200 });
    },
    playBeam(volume = 0.5) {
      if (!state.beamsEnabled || !state.cosmicEnabled) return;
      playOneShot('wave01.mp3', { volume, detuneRange: 300 });
    },
    dispose() {
      disposed = true;
      if (stepTimer) window.clearInterval(stepTimer);
      stopAmbient();
      master?.disconnect();
      context?.close?.();
    },
  };
}
