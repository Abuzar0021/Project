/**
 * The film's sound, made entirely with Web Audio: no files, nothing to
 * license. Every named beat on the timeline has a sound here, built from a
 * few small parts (a tone, a filtered noise burst, a reverb send) in one
 * key, D major, so the cues sit together like a score.
 *
 * The same functions play live in the browser and render offline into a
 * soundtrack for the exported video, so both always match.
 */

type Ctx = BaseAudioContext;

/** D major pentatonic, the notes every cue is built from. */
const NOTE = {
  D2: 73.42,
  A2: 110,
  D3: 146.83,
  A3: 220,
  D4: 293.66,
  Fs4: 369.99,
  A4: 440,
  B4: 493.88,
  D5: 587.33,
  E5: 659.25,
  Fs5: 739.99,
  A5: 880,
  B5: 987.77,
  D6: 1174.66,
} as const;

/** One output for everything: dry signal, a reverb send, and a limiter. */
export interface Bus {
  dry: AudioNode;
  wet: AudioNode;
}

const noiseBuffers = new WeakMap<Ctx, AudioBuffer>();

function noise(ctx: Ctx): AudioBuffer {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

/** A soft room: two seconds of decaying noise as an impulse response. */
function room(ctx: Ctx): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * 2.4);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2);
    }
  }
  return buffer;
}

/**
 * Master chain: dry and reverb are lifted into a compressor that holds the
 * loud clicks down and brings the quiet bed up, then out at a level that
 * sits comfortably next to other video on the web.
 */
export function createBus(ctx: Ctx, destination: AudioNode, level = 0.75): Bus {
  const input = ctx.createGain();
  input.gain.value = 3;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -20;
  limiter.ratio.value = 8;
  limiter.knee.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  const master = ctx.createGain();
  master.gain.value = level;
  const reverb = ctx.createConvolver();
  reverb.buffer = room(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.32;
  wet.connect(reverb).connect(input);
  const dry = ctx.createGain();
  dry.connect(input);
  input.connect(limiter).connect(master).connect(destination);
  return { dry, wet };
}

interface ToneOptions {
  freq: number;
  at: number;
  type?: OscillatorType;
  attack?: number;
  decay?: number;
  gain?: number;
  glideTo?: number;
  send?: number;
}

/** A single enveloped oscillator. */
function tone(ctx: Ctx, bus: Bus, o: ToneOptions) {
  const { at, attack = 0.005, decay = 0.4, gain = 0.1, send = 0.3 } = o;
  const osc = ctx.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, at);
  if (o.glideTo)
    osc.frequency.exponentialRampToValueAtTime(o.glideTo, at + attack + decay);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  osc.connect(env);
  env.connect(bus.dry);
  if (send > 0) {
    const s = ctx.createGain();
    s.gain.value = send;
    env.connect(s).connect(bus.wet);
  }
  osc.start(at);
  osc.stop(at + attack + decay + 0.05);
}

interface NoiseOptions {
  at: number;
  duration: number;
  gain?: number;
  filter?: BiquadFilterType;
  freq?: number;
  sweepTo?: number;
  q?: number;
  attack?: number;
  send?: number;
}

/** A filtered burst of noise: clicks, air, whooshes. */
function hiss(ctx: Ctx, bus: Bus, o: NoiseOptions) {
  const { at, duration, gain = 0.1, attack = 0.005, send = 0.2 } = o;
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = o.filter ?? "bandpass";
  filter.Q.value = o.q ?? 0.8;
  filter.frequency.setValueAtTime(o.freq ?? 1000, at);
  if (o.sweepTo)
    filter.frequency.exponentialRampToValueAtTime(o.sweepTo, at + duration);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  src.connect(filter).connect(env);
  env.connect(bus.dry);
  if (send > 0) {
    const s = ctx.createGain();
    s.gain.value = send;
    env.connect(s).connect(bus.wet);
  }
  src.start(at);
  src.stop(at + duration + 0.05);
}

/** Air moving past the camera, rising or falling. */
function whoosh(ctx: Ctx, bus: Bus, at: number, rising = true, gain = 0.09) {
  hiss(ctx, bus, {
    at,
    duration: 0.9,
    attack: 0.35,
    gain,
    freq: rising ? 300 : 2200,
    sweepTo: rising ? 2200 : 300,
    q: 1.2,
    send: 0.4,
  });
}

/** A key on a good keyboard: a short tick and a little body. */
function keyClick(ctx: Ctx, bus: Bus, at: number, gain = 1) {
  hiss(ctx, bus, {
    at,
    duration: 0.035,
    gain: 0.12 * gain,
    filter: "highpass",
    freq: 2600,
    send: 0.05,
  });
  tone(ctx, bus, { at, freq: 210, decay: 0.05, gain: 0.08 * gain, send: 0.05 });
}

/** A rounded, marimba-like pluck. */
function pluck(ctx: Ctx, bus: Bus, at: number, freq: number, gain = 0.08) {
  tone(ctx, bus, { at, freq, type: "triangle", decay: 0.5, gain, send: 0.35 });
  tone(ctx, bus, {
    at,
    freq: freq * 2,
    decay: 0.18,
    gain: gain * 0.3,
    send: 0.2,
  });
}

/** A slow chord that blooms and fades, for the logo and the end. */
function swell(
  ctx: Ctx,
  bus: Bus,
  at: number,
  notes: number[],
  gain = 0.045,
  length = 3.2,
) {
  for (const freq of notes) {
    tone(ctx, bus, {
      at,
      freq,
      type: "sine",
      attack: 0.9,
      decay: length,
      gain,
      send: 0.6,
    });
    tone(ctx, bus, {
      at,
      freq: freq * 1.003,
      type: "triangle",
      attack: 1.1,
      decay: length,
      gain: gain * 0.4,
      send: 0.6,
    });
  }
}

/** Play the sound for one beat at a time on the audio clock. */
export function playBeat(ctx: Ctx, bus: Bus, name: string, at: number) {
  if (name.startsWith("key-")) return keyClick(ctx, bus, at);
  if (name.startsWith("accept-")) {
    pluck(ctx, bus, at, NOTE.A5, 0.07);
    pluck(ctx, bus, at + 0.09, NOTE.D6, 0.07);
    return;
  }
  switch (name) {
    case "open":
    case "problem":
    case "line":
      hiss(ctx, bus, {
        at,
        duration: 1.3,
        attack: 0.5,
        gain: 0.03,
        freq: 500,
        sweepTo: 1400,
        send: 0.5,
      });
      tone(ctx, bus, {
        at,
        freq: NOTE.D3,
        attack: 0.5,
        decay: 1.6,
        gain: 0.035,
        send: 0.5,
      });
      return;
    case "tick":
      // The loop: dry, quick, and a touch higher each time.
      tone(ctx, bus, {
        at,
        freq: 1500 + ((at * 977) % 1) * 500,
        decay: 0.03,
        gain: 0.07,
        send: 0.02,
      });
      keyClick(ctx, bus, at, 0.6);
      return;
    case "cut":
      tone(ctx, bus, {
        at,
        freq: 62,
        glideTo: 34,
        decay: 0.9,
        gain: 0.5,
        send: 0.2,
      });
      hiss(ctx, bus, {
        at,
        duration: 0.25,
        gain: 0.12,
        filter: "lowpass",
        freq: 900,
        send: 0.3,
      });
      return;
    case "logo":
      swell(ctx, bus, at, [NOTE.D3, NOTE.A3, NOTE.D4, NOTE.Fs4]);
      tone(ctx, bus, {
        at: at + 0.4,
        freq: NOTE.D6,
        attack: 0.6,
        decay: 2.2,
        gain: 0.012,
        send: 0.9,
      });
      return;
    case "flatten":
      tone(ctx, bus, { at, freq: NOTE.D4, decay: 0.12, gain: 0.08, send: 0.2 });
      keyClick(ctx, bus, at, 0.5);
      return;
    case "arrive":
      pluck(ctx, bus, at, NOTE.A4, 0.07);
      return;
    case "write":
      hiss(ctx, bus, {
        at,
        duration: 1.4,
        attack: 0.2,
        gain: 0.035,
        filter: "highpass",
        freq: 4000,
        sweepTo: 2500,
        send: 0.2,
      });
      return;
    case "underline":
      [NOTE.D5, NOTE.E5, NOTE.Fs5, NOTE.A5, NOTE.B5].forEach((f, i) =>
        pluck(ctx, bus, at + i * 0.16, f, 0.035),
      );
      return;
    case "notes":
      [NOTE.D5, NOTE.Fs5, NOTE.A5, NOTE.D6].forEach((f, i) =>
        pluck(ctx, bus, at + i * 0.14, f, 0.045),
      );
      return;
    case "wide":
    case "switch":
    case "gather":
      return whoosh(ctx, bus, at, true);
    case "push-in":
    case "fold":
      return whoosh(ctx, bus, at, false);
    case "focus":
      tone(ctx, bus, { at, freq: NOTE.A5, decay: 0.08, gain: 0.05, send: 0.2 });
      return;
    case "menu":
      tone(ctx, bus, {
        at,
        freq: 600,
        glideTo: 900,
        decay: 0.08,
        gain: 0.07,
        send: 0.15,
      });
      return;
    case "bars":
      [NOTE.D4, NOTE.Fs4, NOTE.A4, NOTE.D5, NOTE.Fs4, NOTE.B4, NOTE.A4].forEach(
        (f, i) => pluck(ctx, bus, at + i * 0.08, f, 0.05),
      );
      return;
    case "long":
      tone(ctx, bus, {
        at,
        freq: 196,
        type: "triangle",
        attack: 0.02,
        decay: 0.8,
        gain: 0.07,
        send: 0.3,
      });
      tone(ctx, bus, {
        at,
        freq: 207.65,
        type: "sine",
        attack: 0.02,
        decay: 0.8,
        gain: 0.04,
        send: 0.3,
      });
      return;
    case "meter":
      tone(ctx, bus, {
        at,
        freq: NOTE.A4,
        glideTo: NOTE.A5,
        attack: 0.05,
        decay: 0.8,
        gain: 0.04,
        send: 0.4,
      });
      pluck(ctx, bus, at + 0.8, NOTE.D6, 0.05);
      return;
    case "stet":
      pluck(ctx, bus, at, NOTE.D5, 0.07);
      pluck(ctx, bus, at + 0.12, NOTE.A4, 0.07);
      return;
    case "file":
      pluck(ctx, bus, at, NOTE.Fs5, 0.05);
      tone(ctx, bus, { at, freq: 120, decay: 0.15, gain: 0.08, send: 0.1 });
      return;
    case "remembered":
      pluck(ctx, bus, at, NOTE.Fs5, 0.05);
      pluck(ctx, bus, at + 0.1, NOTE.A5, 0.04);
      return;
    case "dissolve":
      tone(ctx, bus, {
        at,
        freq: 1760,
        glideTo: 880,
        attack: 0.05,
        decay: 0.8,
        gain: 0.025,
        send: 0.8,
      });
      return;
    case "pen":
      swell(ctx, bus, at, [NOTE.D2, NOTE.A2, NOTE.D3], 0.06, 2.6);
      return;
    case "end":
      swell(ctx, bus, at, [NOTE.D3, NOTE.Fs4, NOTE.A4, NOTE.D5], 0.04, 4);
      return;
    default:
      tone(ctx, bus, { at, freq: NOTE.A5, decay: 0.06, gain: 0.04, send: 0.2 });
  }
}

/** A quiet bed under the whole film: two detuned saws through a slow filter. */
export function createPad(ctx: Ctx, bus: Bus, start: number, level = 0.022) {
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, start);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 520;
  filter.Q.value = 0.6;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const depth = ctx.createGain();
  depth.gain.value = 180;
  lfo.connect(depth).connect(filter.frequency);
  const voices = [
    NOTE.D2,
    NOTE.D2 * 1.004,
    NOTE.A2 * 0.998,
    NOTE.D3 * 1.002,
  ].map((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = i === 0 ? "sine" : "sawtooth";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 1.4 : 0.35;
    osc.connect(g).connect(filter);
    osc.start(start);
    return osc;
  });
  lfo.start(start);
  filter.connect(out);
  out.connect(bus.dry);
  const send = ctx.createGain();
  send.gain.value = 0.5;
  out.connect(send).connect(bus.wet);
  return {
    gain: out.gain,
    level,
    stop(at: number) {
      for (const osc of voices) osc.stop(at);
      lfo.stop(at);
    },
  };
}

/**
 * The finished mix for a film of the given length and beats, rendered
 * offline. The bed fades in, drops out for the hard cut, and resolves under
 * the last chord.
 */
export async function renderSoundtrack(
  duration: number,
  beats: { name: string; time: number }[],
  sampleRate = 48000,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(
    2,
    Math.ceil((duration + 2) * sampleRate),
    sampleRate,
  );
  const bus = createBus(ctx, ctx.destination);
  const pad = createPad(ctx, bus, 0);
  pad.gain.linearRampToValueAtTime(pad.level, 3);
  const cut = beats.find((b) => b.name === "cut");
  if (cut) {
    pad.gain.setValueAtTime(pad.level, cut.time - 0.05);
    pad.gain.linearRampToValueAtTime(0.0001, cut.time);
    pad.gain.setValueAtTime(0.0001, cut.time + 0.7);
    pad.gain.linearRampToValueAtTime(pad.level, cut.time + 3);
  }
  pad.gain.setValueAtTime(pad.level, duration - 3);
  pad.gain.linearRampToValueAtTime(0.0001, duration + 1.5);
  pad.stop(duration + 2);
  for (const beat of beats)
    playBeat(ctx, bus, beat.name, Math.max(0.01, beat.time));
  return ctx.startRendering();
}

/** 16-bit PCM WAV bytes from an audio buffer. */
export function toWav(buffer: AudioBuffer): ArrayBuffer {
  const channels = buffer.numberOfChannels;
  const frames = buffer.length;
  const bytes = 44 + frames * channels * 2;
  const view = new DataView(new ArrayBuffer(bytes));
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, bytes - 8, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, frames * channels * 2, true);
  const data = Array.from({ length: channels }, (_, c) =>
    buffer.getChannelData(c),
  );
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      const sample = Math.max(-1, Math.min(1, data[c]?.[i] ?? 0));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += 2;
    }
  }
  return view.buffer;
}

/**
 * Live sound for the page. It starts on a click (browsers require one),
 * plays each beat as the playhead passes it going forward, and keeps the
 * bed running while the film is on screen.
 */
export class FilmSound {
  private ctx: AudioContext | null = null;
  private bus: Bus | null = null;
  private pad: ReturnType<typeof createPad> | null = null;
  private recent: number[] = [];
  enabled = false;

  async enable() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.bus = createBus(this.ctx, this.ctx.destination);
      this.pad = createPad(this.ctx, this.bus, this.ctx.currentTime);
    }
    await this.ctx.resume();
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.setBed(false);
  }

  /** Fade the bed in while the film is on screen and sound is on. */
  setBed(on: boolean) {
    if (!this.ctx || !this.pad) return;
    const now = this.ctx.currentTime;
    const target = on && this.enabled ? this.pad.level : 0.0001;
    this.pad.gain.cancelScheduledValues(now);
    this.pad.gain.setTargetAtTime(target, now, 0.6);
  }

  beat(name: string) {
    if (!this.enabled || !this.ctx || !this.bus) return;
    // A fast scrub crosses many beats at once; let a few through, not all.
    const now = performance.now();
    this.recent = this.recent.filter((t) => now - t < 150);
    if (this.recent.length >= 3) return;
    this.recent.push(now);
    playBeat(this.ctx, this.bus, name, this.ctx.currentTime + 0.01);
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
  }
}
