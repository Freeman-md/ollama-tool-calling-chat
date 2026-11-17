import {readFileSync, writeFileSync} from 'node:fs';
import {beats, format, reveals} from './src/film/timing.mjs';

const rate = 48000;
const samples = Math.round(rate * format.seconds);
const buffer = Buffer.alloc(samples * 4);
const sine = (hz, t) => Math.sin(2 * Math.PI * hz * t);
const clamp = (value) => Math.max(0, Math.min(value, 1));
const env = (t, attack, decay) => t < 0 ? 0 : clamp(t / attack) * Math.exp(-t / decay);
const chords = [
  [110, 164.81, 220, 261.63], [98, 146.83, 196, 246.94],
  [130.81, 196, 246.94, 293.66], [110, 164.81, 207.65, 261.63],
];
const soundCues = [
  [beats.core, 180, .22, .09], [beats.web, 326, .18, .07],
  [beats.whatsapp, 280, .20, .075], [beats.telegram, 315, .20, .075],
  [beats.voice, 415, .15, .08], [beats.network, 522, .54, .13],
  ...Object.values(reveals).flatMap(({question, reply, product}) => [
    [question, 665, .075, .075], [reply, 550, .13, .09], [product, 790, .21, .08],
  ]),
];
let seed = 135;
let filteredNoise = 0;

for (let i = 0; i < samples; i++) {
  const t = i / rate;
  const chord = chords[Math.floor(t / 2.4) % chords.length];
  const bar = t % 2.4;
  const beat = t % .6;
  const duck = 1 - .62 * clamp((t - 19.62) / .31) * clamp((25.07 - t) / .45);
  const low = .17 * sine(chord[0] / 2, bar) * env(bar, .13, 1.4);
  const kick = .16 * sine(43 + 27 * Math.exp(-beat * 35), beat) * env(beat, .008, .06);
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  filteredNoise = filteredNoise * .88 + (seed / 2147483648 - 1) * .12;
  const hats = filteredNoise * env(t % .3, .007, .047) * .12;
  const keys = chord.map((hz, n) => {
    const delay = bar - .12 * n;
    return (sine(hz, delay) + .24 * sine(hz * 2.002, delay)) * env(delay, .075, .77) * .057;
  });
  const accents = soundCues.reduce((sum, [cue, hz, tail, level]) => {
    const local = t - cue;
    return sum + (sine(hz, local) + .22 * sine(hz * 2, local)) * env(local, .012, tail) * level;
  }, 0);
  const sweeps = [beats.core, beats.web, beats.whatsapp, beats.telegram, beats.voice, beats.network].reduce(
    (sum, cue) => sum + .13 * filteredNoise * env(t - cue + .26, .26, .18), 0,
  );
  const fade = clamp(t / .30) * clamp((format.seconds - t) / .67);
  const middle = (low + kick + hats) * duck + accents + sweeps;
  const left = middle + duck * keys.reduce((sum, note, n) => sum + note * (n % 2 ? .61 : 1), 0);
  const right = middle + duck * keys.reduce((sum, note, n) => sum + note * (n % 2 ? 1 : .61), 0);
  buffer.writeInt16LE(Math.round(left * fade * 1.22 * 32767), i * 4);
  buffer.writeInt16LE(Math.round(right * fade * 1.22 * 32767), i * 4 + 2);
}

const header = Buffer.alloc(44);
header.write('RIFF');
header.writeUInt32LE(buffer.length + 36, 4);
header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(buffer.length, 40);
writeFileSync(new URL('./public/film-mix.wav', import.meta.url), Buffer.concat([header, buffer]));

function envelope(prefix, name) {
  const wav = readFileSync(new URL(`./public/${prefix}-${name}.wav`, import.meta.url));
  const levels = [];
  if (wav.readUInt16LE(22) !== 1 || wav.readUInt16LE(34) !== 16 || wav.readUInt32LE(24) !== rate) {
    throw Error('Expected 48 kHz 16-bit mono dialogue');
  }
  for (let offset = 12; offset + 8 <= wav.length;) {
    const count = wav.readUInt32LE(offset + 4);
    if (wav.toString('ascii', offset, offset + 4) === 'data') {
      const frameSize = rate / format.fps;
      const end = offset + 8 + count;
      for (let cursor = offset + 8; cursor < end; cursor += frameSize * 2) {
        let sum = 0;
        let n = 0;
        for (let i = cursor; i < Math.min(end, cursor + frameSize * 2); i += 2) {
          sum += (wav.readInt16LE(i) / 32768) ** 2;
          n++;
        }
        levels.push(Number(clamp(Math.sqrt(sum / n) * 6.7).toFixed(3)));
      }
      return levels;
    }
    offset += 8 + count + count % 2;
  }
  throw Error(`Missing voice data for ${name}`);
}

for (const [prefix, output] of [['film', 'waveform'], ['phone', 'phone-waveform']]) {
  const data = {question: envelope(prefix, 'question'), answer: envelope(prefix, 'answer')};
  writeFileSync(new URL(`./src/film/${output}.json`, import.meta.url), JSON.stringify(data) + '\n');
}
