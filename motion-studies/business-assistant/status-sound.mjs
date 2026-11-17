import {writeFileSync} from 'node:fs';
import {channelMoves, moments, statusDuration} from './src/status-timing.mjs';

const rate = 48000;
const length = Math.round(rate * statusDuration);
const harmonicLoop = [
  [110, 164.81, 196, 261.63],
  [130.81, 196, 246.94, 293.66],
  [98, 146.83, 196, 246.94],
  [110, 164.81, 207.65, 261.63],
];
const accents = [
  [moments.gather, 92, .26, .12], [moments.core, 220, .4, .14],
  [moments.web, 466, .25, .105], [moments.recommendation, 699, .4, .115],
  [moments.whatsapp, 440, .23, .10], [moments.stock, 660, .36, .10],
  [moments.telegram, 494, .24, .105], [moments.notes, 740, .35, .10],
  [moments.voice, 415, .29, .09], [moments.close, 587, .48, .12],
];

const pcm = Buffer.alloc(length * 4);
const sine = (hz, t) => Math.sin(Math.PI * 2 * hz * t);
const env = (t, attack, decay) => t < 0 ? 0 : Math.min(1, t / attack) * Math.exp(-t / decay);
const clamp = (v) => Math.max(0, Math.min(1, v));
let seed = 34;

for (let i = 0; i < length; i++) {
  const t = i / rate;
  const phrase = t % 2.4;
  const beat = t % .6;
  const chord = harmonicLoop[Math.floor(t / 2.4) % harmonicLoop.length];
  const low = .10 * (sine(chord[0] / 2, phrase) + .22 * sine(chord[0], phrase)) * env(phrase, .09, 1.40);
  const kick = .10 * sine(50 + 22 * Math.exp(-beat * 24), beat) * env(beat, .008, .069);
  const voiceWindow = clamp((t - 19.18) / .42) * clamp((24.8 - t) / .54);
  const bedGain = 1 - .59 * voiceWindow;
  const tone = chord.map((hz, n) => {
    const local = phrase - .14 * n;
    return (sine(hz, local) + .24 * sine(hz * 2, local)) * env(local, .07, .81) * .055;
  });
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  const noise = seed / 2147483648 - 1;
  const hats = noise * env(t % .3, .008, .040) * .015;
  const swells = channelMoves.reduce((sum, move) => {
    const swell = env(t - move.to + .54, .43, .27) * noise * .022;
    return sum + swell;
  }, 0);
  const taps = accents.reduce((sum, [onset, hz, decay, level]) => {
    const local = t - onset;
    return sum + (sine(hz, local) + .24 * sine(hz * 1.5, local)) * env(local, .009, decay) * level;
  }, 0);
  const fade = clamp(t / .35) * clamp((statusDuration - t) / .95);
  const middle = (low + kick + hats) * bedGain + taps + swells;
  const left = middle + bedGain * tone.reduce((sum, note, n) => sum + note * (n % 2 ? .63 : 1), 0);
  const right = middle + bedGain * tone.reduce((sum, note, n) => sum + note * (n % 2 ? 1 : .63), 0);
  pcm.writeInt16LE(Math.round(left * fade * 1.50 * 32767), i * 4);
  pcm.writeInt16LE(Math.round(right * fade * 1.50 * 32767), i * 4 + 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(pcm.length + 36, 4);
header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);

writeFileSync(new URL('./public/status-score.wav', import.meta.url), Buffer.concat([header, pcm]));
