import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Sequence, cancelRender, continueRender, delayRender, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion';
import {progress} from '../../../../skills/freemancodz-motion/assets/motion.mjs';
import {Brand, theme} from './visual.jsx';
import {Web, Messenger, Voice} from './channels.jsx';
import {Opening, Hub, Closing} from './stages.jsx';
import {beats, format, handoffs} from './timing.mjs';
import perfumeWaveform from './waveform.json';
import phoneWaveform from './phone-waveform.json';
import {perfume, phone} from './presets.mjs';

const products = {perfume, phone};
const waveforms = {perfume: perfumeWaveform, phone: phoneWaveform};

const backdrop = [
  ['#203a39', '#132d38'], ['#29504a', '#0f1c30'], ['#375054', '#142738'],
  ['#1f544f', '#091d29'], ['#214869', '#102940'], ['#28494d', '#131c34'], ['#20534c', '#0b2034'],
];
const directions = {
  right: {x: 1, y: 0, mask: 'to right', line: 'to right'},
  left: {x: -1, y: 0, mask: 'to left', line: 'to right'},
  up: {x: 0, y: -1, mask: 'to top', line: 'to bottom'},
};

function LoadFont() {
  const [handle] = useState(() => delayRender('Load Manrope'));
  useEffect(() => {
    document.fonts.load('800 42px Manrope').then(() => continueRender(handle), cancelRender);
  }, [handle]);
  return null;
}

function Room({index, time}) {
  const [rim, floor] = backdrop[index];
  const light = 48 + 6 * Math.sin(time * .52);
  return <AbsoluteFill style={{
    background: `radial-gradient(ellipse at ${light}% 48%,${rim} 0%,${floor} 44%,${theme.ink} 85%)`,
  }}>
    <svg width="720" height="1280" style={{position: 'absolute', transform: `translateX(${5 * Math.sin(time * .8)}px)`}}>
      <defs>
        <radialGradient id={`fog-${index}`}><stop offset="0" stopColor="white"/><stop offset="1" stopColor="black"/></radialGradient>
        <mask id={`floor-${index}`}><rect width="720" height="1280" fill={`url(#fog-${index})`}/></mask>
      </defs>
      <g fill="none" stroke={theme.mint} strokeOpacity=".18" mask={`url(#floor-${index})`}>
        {[135, 215, 300, 391, 489, 594].map((r) => <ellipse key={r} cx="360" cy="762" rx={r} ry={r * .42}/>)}
        <path d="M0 1030l720-540M0 490l720 540M360 330v900"/>
      </g>
    </svg>
  </AbsoluteFill>;
}

function Content({index, time, item, waveform}) {
  if (index === 0) return <Opening time={time} item={item}/>;
  if (index === 1) return <Hub time={time}/>;
  if (index === 2) return <Web time={time} item={item}/>;
  if (index === 3) return <Messenger time={time} type="whatsapp" item={item}/>;
  if (index === 4) return <Messenger time={time} type="telegram" item={item}/>;
  if (index === 5) return <Voice time={time} waveform={waveform} item={item}/>;
  return <Closing time={time}/>;
}

function Shot({index, time, item, waveform, shiftX = 0, shiftY = 0, scale = 1, blur = 0, mask}) {
  return <AbsoluteFill style={{maskImage: mask}}>
    {index !== 0 && <Room index={index} time={time}/>}
    <AbsoluteFill style={{
      transform: `translate(${shiftX}px,${shiftY}px) scale(${scale})`,
      transformOrigin: '360px 660px', filter: blur > .3 ? `blur(${blur}px)` : undefined,
    }}><Content index={index} time={time} item={item} waveform={waveform}/></AbsoluteFill>
  </AbsoluteFill>;
}

function Edit({time, item, waveform}) {
  const active = handoffs.findIndex(({at, span}) => time >= at - span / 2 && time < at + span / 2);
  if (active === -1) {
    const settled = handoffs.filter(({at}) => time >= at).length;
    return <Shot index={settled} time={time} item={item} waveform={waveform}/>;
  }

  const {at, span, axis} = handoffs[active];
  const travel = progress(time, at - span / 2, at + span / 2);
  const direction = directions[axis];
  const cut = -20 + 140 * travel;
  const horizontal = direction.y === 0;
  const displacement = horizontal ? 92 : 138;
  const motion = Math.sin(Math.PI * travel);

  // Both sides use the same eased clock. UI is already in its readable layout when the matte clears.
  const matte = `linear-gradient(${direction.mask}, black ${cut - 9}%, transparent ${cut + 9}%)`;
  const position = cut / 100;
  const edgeX = (direction.x < 0 ? 1 - position : position) * format.width;
  const edgeY = (1 - position) * format.height;
  return <>
    <Shot index={active} time={time} item={item} waveform={waveform}
      shiftX={direction.x * displacement * travel} shiftY={direction.y * displacement * travel}
      scale={1 + .048 * travel} blur={motion * 2.1}/>
    <Shot index={active + 1} time={time} item={item} waveform={waveform} mask={matte}
      shiftX={-direction.x * displacement * (1 - travel)} shiftY={-direction.y * displacement * (1 - travel)}
      scale={1 - .055 * (1 - travel)} blur={motion * 2.1}/>
    <div style={{
      position: 'absolute', pointerEvents: 'none',
      ...(horizontal ? {top: 0, bottom: 0, left: edgeX - 85, width: 170} : {left: 0, right: 0, top: edgeY - 135, height: 270}),
      background: `linear-gradient(${direction.line},transparent,#66e3cc10 36%,#88f5e64d 49%,#66e3cc10 63%,transparent)`,
      opacity: .85 * motion,
    }}/>
  </>;
}

const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='156' height='156'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.83' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Cpath fill='%23fff' d='M0 0h156v156H0z' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function NewBusinessFilm({proof = false, business = 'perfume'}) {
  const item = products[business];
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps + (proof ? 9.25 : 0);
  return <AbsoluteFill style={{overflow: 'hidden', background: theme.ink, color: theme.paper, fontFamily: 'Manrope, sans-serif'}}>
    <style>{`@font-face{font-family:Manrope;src:url(${staticFile('manrope.woff2')}) format('woff2');font-weight:200 800}*{box-sizing:border-box}`}</style>
    <LoadFont/>
    <Edit time={time} item={item} waveform={waveforms[business]}/>
    <Brand/>
    <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 48%,transparent 58%,#020c1b66)'}}/>
    <AbsoluteFill style={{pointerEvents: 'none', backgroundImage: grain, mixBlendMode: 'soft-light', opacity: .09}}/>
    {!proof && <>
      <Audio src={staticFile('film-mix.wav')}/>
      <Sequence from={Math.round(beats.question * fps)}><Audio src={staticFile(`${item.audioPrefix}-question.wav`)} volume={.92}/></Sequence>
      <Sequence from={Math.round(beats.answer * fps)}><Audio src={staticFile(`${item.audioPrefix}-answer.wav`)} volume={.92}/></Sequence>
    </>}
  </AbsoluteFill>;
}
