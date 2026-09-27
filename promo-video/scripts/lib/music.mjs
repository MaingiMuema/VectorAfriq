// Synthesizes an original ambient-electronic music bed (pure Node, no deps).
// A-minor chord pads + bass + soft half-time beat + sparkle arpeggio + airy swells.
// Writes a 44.1kHz 16-bit stereo WAV.
//
// Extracted from scripts/gen-music.mjs so scripts/render-job.mjs can generate
// a music bed sized to the narration duration at render time.

const TAU = Math.PI * 2;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

function noise(seed) {
  let s = seed || 1234;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s / 4294967296) * 2 - 1;
  };
}

// Envelope
function adsr(t, a, d, s, r, gate) {
  const attack = clamp(t / a, 0, 1);
  const decay = clamp((t - a) / d, 0, 1);
  const env = attack * (1 - decay + decay * s);
  const release = clamp((t - gate) / r, 0, 1);
  return t >= gate ? env * (1 - release) : env;
}

/**
 * Synthesize the music bed.
 * @param {number} durationSeconds Total duration of the track in seconds.
 * @returns {Buffer} 16-bit stereo PCM WAV file bytes.
 */
export function synthesizeMusic(durationSeconds) {
  const SR = 44100;
  const DUR = durationSeconds;
  const N = Math.floor(SR * DUR);

  // --- arrangement -----------------------------------------------------------
  // 90 BPM, one bar = 8 beats = 2.6667s. 4-bar chord loop = 10.667s.
  const BPM = 90;
  const SPB = 60 / BPM; // seconds per beat
  const BAR = SPB * 8;
  const CHORDS = [
    [57, 60, 64, 67, 71], // Am9   A C E G B
    [53, 57, 60, 64, 69], // Fmaj9 F A C E A
    [48, 52, 55, 59, 64], // Cmaj9 C E G B E
    [55, 59, 62, 66, 69], // G9    G B D F# A
  ];
  const BASS = [45, 41, 36, 43]; // A2, F2, C2, G2

  const totalBars = DUR / BAR;
  let L = new Float32Array(N);
  let R = new Float32Array(N);

  const mix = (buf, from, to, gain) => {
    for (let i = Math.floor(from * SR); i < Math.min(N, Math.ceil(to * SR)); i++) {
      const j = i - Math.floor(from * SR);
      if (j >= buf.length) break;
      L[i] += buf[j] * gain;
      R[i] += buf[j] * gain;
    }
  };

  // 1) Pads — detuned sines+triangles, slow attack, airy
  const padBuf = new Float32Array(Math.floor(BAR * SR));
  for (let b = 0; b < totalBars; b++) {
    const chord = CHORDS[b % 4];
    const start = b * BAR;
    for (let k = 0; k < chord.length; k++) {
      const f = midi(chord[k]);
      const gate = (b + 1) * BAR;
      for (let t = 0; t < BAR; t++) {
        const tt = start + t;
        const env = adsr(t, 0.7, 0.6, 0.85, 0.9, BAR - 0.05);
        let s =
          Math.sin(TAU * f * tt) * 0.5 +
          Math.sin(TAU * (f * 1.005) * tt) * 0.3 +
          Math.sin(TAU * (f * 0.5) * tt) * 0.25;
        s *= 0.75 + 0.25 * Math.sin(TAU * 0.25 * tt + k);
        padBuf[t] = (padBuf[t] || 0) + s * env * 0.12;
      }
    }
  }

  // 2) Bass — sine pulse on beats 1 and 5 (half-time), slight pitch drop
  const bassBuf = new Float32Array(Math.floor(BAR * SR));
  for (let b = 0; b < totalBars; b++) {
    const f = midi(BASS[b % 4]);
    for (let beat = 0; beat < 8; beat += 4) {
      const start = (b * 8 + beat) * SPB;
      for (let t = 0; t < SPB * 3; t++) {
        const tt = start + t;
        const env = adsr(t, 0.01, 0.4, 0.5, 0.25, SPB * 3);
        const s = Math.sin(TAU * f * tt) * 0.9 + Math.sin(TAU * f * 2 * tt) * 0.1;
        bassBuf[t] = (bassBuf[t] || 0) + s * env * 0.16;
      }
    }
  }

  // 3) Kick — decaying sine sweep, beats 1 and 3 (half-time feel)
  const kickBuf = new Float32Array(Math.floor(SPB * 4));
  for (let t = 0; t < SPB * 4; t++) {
    const env = Math.exp(-t * 7);
    const f = 110 * Math.exp(-t * 9) + 45;
    kickBuf[t] = Math.sin(TAU * f * t) * env;
  }
  // 4) Snare-ish clap — filtered noise, beat 3
  const clapBuf = new Float32Array(Math.floor(SPB * 2));
  {
    const rnd = noise(99);
    for (let t = 0; t < SPB * 2; t++) {
      const env = Math.exp(-t * 10);
      clapBuf[t] = rnd() * env * 0.6;
    }
  }
  // 5) Hats — short noise ticks on off-beats
  const hatBuf = new Float32Array(Math.floor(SPB * 0.9));
  {
    const rnd = noise(7);
    for (let t = 0; t < SPB * 0.9; t++) {
      hatBuf[t] = rnd() * Math.exp(-t * 60) * 0.35;
    }
  }

  for (let b = 0; b < totalBars; b++) {
    const t0 = b * BAR;
    // drums: kick beats 1 & 3; clap beat 3; hats on off eighths
    for (const [beat, which] of [[0, "k"], [4, "k"], [4, "c"]]) {
      const start = t0 + beat * SPB;
      const buf = which === "k" ? kickBuf : clapBuf;
      mix(buf, start, start + buf.length / SR, which === "k" ? 0.5 : 0.22);
    }
    for (let beat = 0; beat < 8; beat++) {
      if (beat % 2 === 0) continue;
      const start = t0 + beat * SPB;
      mix(hatBuf, start, start + hatBuf.length / SR, 0.14);
    }
  }

  // 6) Sparkle arpeggio — 16ths on chord tones, high register, soft triangle
  {
    const arpBuf = new Float32Array(Math.floor(BAR * SR));
    for (let b = 0; b < totalBars; b++) {
      const chord = CHORDS[b % 4];
      const seq = [0, 2, 1, 3, 2, 4, 1, 3, 0, 2, 3, 4, 1, 3, 2, 1];
      for (let s = 0; s < 16; s++) {
        const note = chord[seq[s]] + 12;
        const f = midi(note);
        const start = b * BAR + (s / 16) * BAR;
        for (let t = 0; t < 0.5; t++) {
          const tt = start + t;
          const env = Math.exp(-t * 8);
          const tri = (2 / Math.PI) * Math.asin(Math.sin(TAU * f * tt));
          arpBuf[t] = (arpBuf[t] || 0) + tri * env * 0.07;
        }
      }
    }
    mix(arpBuf, 0, DUR, 1);
  }

  // 7) Airy shimmer swell every 4 bars + final riser
  {
    const swellBuf = new Float32Array(Math.floor(BAR * SR));
    const rnd = noise(42);
    for (let t = 0; t < BAR; t++) {
      const env = Math.sin((Math.PI * t) / BAR);
      const wob = 0.6 + 0.4 * Math.sin(TAU * 2.2 * t);
      swellBuf[t] = rnd() * env * wob * 0.08;
    }
    for (let b = 0; b < totalBars; b++) mix(swellBuf, b * BAR, (b + 1) * BAR, 1);
    // final riser for the outro
    const riser = new Float32Array(Math.floor(6 * SR));
    const rnd2 = noise(5);
    for (let t = 0; t < 6; t++) {
      const p = t / 6;
      riser[t] = rnd2() * Math.pow(p, 2.2) * 0.05 + Math.sin(TAU * (400 + 900 * p) * t) * 0.012 * p;
    }
    mix(riser, DUR - 6, DUR, 1);
  }

  // Master mix + gentle fade in/out
  const master = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const fadeIn = clamp(t / 0.8, 0, 1);
    const fadeOut = clamp((DUR - t) / 1.5, 0, 1);
    master[i] = (L[i] + R[i]) * 0.5 * fadeIn * fadeOut;
  }
  // soft limiter
  for (let i = 0; i < N; i++) master[i] = Math.tanh(master[i] * 1.4);

  // --- write WAV (16-bit stereo) ---------------------------------------------
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + N * 4, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(2, 22); // stereo
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(N * 4, 40);

  const data = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    const v = clamp(master[i], -1, 1);
    const s16 = v < 0 ? v * 0x8000 : v * 0x7fff;
    data.writeInt16LE(Math.round(s16), i * 4);
    data.writeInt16LE(Math.round(s16), i * 4 + 2);
  }
  return Buffer.concat([header, data]);
}
