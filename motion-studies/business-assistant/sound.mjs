import {writeFileSync} from 'node:fs';
import {beats} from './src/score.mjs';

const rate = 48000;
const frames = Math.round(rate * beats.end);
const pcm = Buffer.alloc(frames * 4);
const chords = [
  [110, 164.81, 196, 261.63],
  [130.81, 196, 246.94, 293.66],
  [98, 146.83, 196, 246.94],
  [110, 164.81, 196, 261.63],
];
const cues = [
  [beats.gather, 74, .15, .12],
  [beats.assembled, 210, .29, .17],
  [beats.web, 523, .18, .09],
  [beats.result, 660, .17, .1],
  [beats.inbox, 494, .18, .09],
  [beats.received, 784, .26, .11],
];
let seed = 31;
const sine = (hz, seconds) => Math.sin(2 * Math.PI * hz * seconds);
const envelope = (t, attack, decay) => t < 0 ? 0 : Math.min(1, t / attack) * Math.exp(-t / decay);

for (let sample = 0; sample < frames; sample++) {
  const t = sample / rate;
  const quarter = t % .5;
  const bar = Math.floor(t / 2);
  const barTime = t % 2;
  const chord = chords[bar];
  const bass = sine(chord[0] / 2, barTime) * envelope(barTime, .06, 1.18) * .095;
  const kick = sine(49 + 21 * Math.exp(-quarter * 45), quarter) * envelope(quarter, .008, .058) * .082;
  const keys = chord.map((hz, i) => {
    const local = barTime - i * .13;
    return (sine(hz, local) + .2 * sine(hz * 2.002, local)) * envelope(local, .028, .63) * .035;
  });
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  const noise = seed / 2147483648 - 1;
  const sweep = envelope(t - beats.transfer + .28, .27, .19) * noise * .025;
  const clicks = cues.reduce((sum, [onset, hz, decay, level]) => {
    const local = t - onset;
    return sum + sine(hz, local) * envelope(local, .008, decay) * level;
  }, 0);
  const fade = Math.max(0, Math.min(1, t / .2, (beats.end - t) / .52));
  const shared = bass + kick + sweep + clicks;
  const left = shared + keys.reduce((sum, tone, i) => sum + tone * (i % 2 ? .64 : 1), 0);
  const right = shared + keys.reduce((sum, tone, i) => sum + tone * (i % 2 ? 1 : .64), 0);
  pcm.writeInt16LE(Math.round(left * fade * 32767), sample * 4);
  pcm.writeInt16LE(Math.round(right * fade * 32767), sample * 4 + 2);
}

const header = Buffer.alloc(44);
header.write('RIFF');
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
writeFileSync(new URL('./public/score.wav', import.meta.url), Buffer.concat([header, pcm]));
