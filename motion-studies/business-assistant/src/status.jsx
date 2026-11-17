import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence, cancelRender, continueRender,
  delayRender, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {boxStyle, mix, morphRect, progress} from '../../../skills/freemancodz-motion/assets/motion.mjs';
import {channelMoves, moments, statusDuration} from './status-timing.mjs';

const palette = {
  ink: '#020c1b',
  dark: '#0a192f',
  light: '#f4f8fc',
  muted: '#a8bcc8',
  mint: '#64ffda',
  text: '#10242c',
  quiet: '#526976',
  paper: '#f5f8f6',
  glass: 'linear-gradient(145deg, #2d6158, #112d3d 65%, #091924)',
  edge: '#72cab17e',
  floor: '#8ef5df',
  whatsapp: '#155444',
  telegram: '#1f5d88',
  webBubble: '#d6f3e7',
  waBubble: '#d9f4ce',
  tgBubble: '#ddeeff',
};
const shape = (x, y, width, height, radius) => ({x, y, width, height, radius});
const shells = [
  shape(280, 534, 160, 160, 41),
  shape(48, 357, 624, 506, 35),
  shape(83, 319, 554, 570, 42),
  shape(60, 330, 600, 542, 35),
  shape(105, 327, 510, 577, 47),
  shape(306, 560, 108, 108, 30),
];

const icons = {
  spark: 'M12 2v20M2 12h20M5 5l14 14M19 5L5 19',
  catalog: 'M4 8l8-4 8 4v9l-8 4-8-4zM4 8l8 4 8-4M12 12v9',
  faq: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
  stock: 'M4 5h16v14H4zM4 10h16M9 10v9M14 5v5',
  ops: 'M5 4h14v16H5zM8 9l2 2 5-5M8 15h8',
  web: 'M3 5h18v14H3zM3 9h18M6 7h.1M9 7h.1',
  whatsapp: 'M4.5 17l-1 3.5L7 19a8 8 0 1 0-2.5-2zM9 8l-1 1c0 3 3 6 6 6l1.5-1.5M9 8l1.5 2-1 1M15 13.5l-2-1.5-1 1',
  telegram: 'M3 11l18-7-5 16-5-6zM11 14L21 4',
  voice: 'M6 3l4 4-2 3a12 12 0 0 0 6 6l3-2 4 4-2 3C11 22 2 13 3 6z',
  check: 'M4 12l4 4 9-9m-5 9 8-9',
  arrow: 'M6 12h12m-5-5 5 5-5 5',
};

function Icon({name, size = 25}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={icons[name]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

function LoadFont() {
  const [handle] = useState(() => delayRender('Load Freemancodz typography'));
  useEffect(() => {
    document.fonts.load('800 38px Manrope').then(() => continueRender(handle), cancelRender);
  }, [handle]);
  return null;
}

function Enter({amount, children, style}) {
  return <div style={{
    ...style, opacity: amount,
    transform: `translateY(${(1 - amount) * 18}px) scale(${.97 + .03 * amount})`,
  }}>{children}</div>;
}

function Ribbon({amount, x, y, reverse = false}) {
  const bend = reverse ? -110 : 110;
  return <svg width="720" height="1280" viewBox="0 0 720 1280" style={{position: 'absolute', inset: 0, opacity: amount}}>
    <path d={`M${x} ${y} C${x + bend} ${y + 42} ${360 - bend} 665 360 621`}
      stroke={palette.mint} strokeOpacity=".6" strokeWidth="1.8" fill="none"/>
  </svg>;
}

const sources = [
  ['Products', 'catalog', 61, 751],
  ['FAQs', 'faq', 485, 405],
  ['Inventory', 'stock', 467, 762],
  ['Operations', 'ops', 44, 517],
];

function StageBackground({lean, zoom}) {
  return <>
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at ${49 + lean * .13}% 48%, #22595b 0%, #0c293d 38%, #020c1b 80%)`,
    }}/>
    <svg width="720" height="1280" style={{
      position: 'absolute', inset: 0, transformOrigin: '360px 656px',
      transform: `translateX(${lean * -.55}px) scale(${1 + zoom * .035})`,
    }}>
      <defs>
        <radialGradient id="status-falloff"><stop offset="0" stopColor="white"/><stop offset="1" stopColor="black"/></radialGradient>
        <mask id="status-floor"><rect width="720" height="1280" fill="url(#status-falloff)"/></mask>
      </defs>
      <g fill="none" stroke={palette.floor} strokeOpacity=".22" mask="url(#status-floor)">
        {[154, 215, 275, 340, 409, 484, 560].map((radius) =>
          <ellipse key={radius} cx="360" cy="709" rx={radius} ry={radius * .4}/>)}
        <path d="M0 930 720 492M0 492l720 438M360 351v700M0 708h720"/>
      </g>
    </svg>
  </>;
}

function Business({time}) {
  const assemble = progress(time, 1.55, moments.core);
  const arrival = progress(time, 0, 1.4);
  return <>
    <Img src={staticFile('store.webp')} style={{
      ...boxStyle(shape(73, 338, 574, 525, 0)), objectFit: 'contain',
      opacity: 1 - assemble,
      transform: `translate(${assemble * -158}px,${assemble * 60}px) scale(${.93 + arrival * .07 - assemble * .24})`,
    }}/>
    {sources.map(([label, icon, x, y], index) => {
      const gather = progress(time, moments.gather + index * .13, moments.core - .25 + index * .08);
      const enter = .65 + .35 * progress(time, index * .12, .55 + index * .12);
      const opacity = enter * (1 - progress(gather, .78, 1));
      return <React.Fragment key={label}>
        <Ribbon amount={Math.sin(Math.PI * gather) * .76} x={x + 72} y={y + 20} reverse={x > 360}/>
        <div style={{
          position: 'absolute', left: mix(x, 282, gather), top: mix(y, 583, gather),
          minWidth: 148, height: 56, padding: '0 14px',
          display: 'flex', alignItems: 'center', gap: 10, color: palette.mint,
          background: '#153345', border: `1px solid ${palette.edge}`, borderRadius: 15,
          opacity, zIndex: 4, transform: `scale(${mix(enter, .42, gather)})`,
          boxShadow: '0 13px 26px #0007',
        }}><Icon name={icon} size={21}/><span style={{fontSize: 20, fontWeight: 750, color: palette.light}}>{label}</span></div>
      </React.Fragment>;
    })}
  </>;
}

function SurfaceHeader({type, amount}) {
  const web = type === 'web';
  const tint = type === 'whatsapp' ? palette.whatsapp : palette.telegram;
  return <div style={{
    position: 'absolute', insetInline: 0, top: 0, height: web ? 77 : 82,
    display: 'flex', alignItems: 'center', padding: '0 23px 0 79px', gap: 8,
    color: web ? palette.text : palette.light, background: web ? '#ffffff' : tint,
    opacity: amount, borderBottom: web ? '1px solid #d5e4df' : 'none',
  }}>
    <div style={{fontSize: 24, fontWeight: 800, letterSpacing: '-.04em'}}>Store assistant</div>
    <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 800}}>
      <Icon name={type} size={20}/>
      {web ? 'Web' : type === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
    </div>
  </div>;
}

function Bubble({top, ask, amount, color, children, maxWidth = 420}) {
  return <Enter amount={amount} style={{position: 'absolute', top, [ask ? 'right' : 'left']: 24, maxWidth}}>
    <div style={{
      padding: '14px 19px', borderRadius: ask ? '21px 21px 6px 21px' : '21px 21px 21px 6px',
      background: color, color: palette.text, fontSize: 26, fontWeight: 720, lineHeight: 1.17,
      boxShadow: '0 3px 12px #0a282310',
    }}>{children}</div>
  </Enter>;
}

function Product({time, relay, swap, dissolve}) {
  const amount = progress(time, moments.recommendation, moments.recommendation + .4) * (1 - dissolve);
  const top = mix(mix(233, 316, relay), 331, swap);
  const photoSize = mix(132, 95, relay);
  return <Enter amount={amount} style={{
    position: 'absolute', left: 24, right: 24, top,
    height: photoSize + 30, display: 'flex', alignItems: 'center', gap: 17,
    background: palette.light, color: palette.text, borderRadius: 22, padding: 14,
    boxShadow: '0 8px 24px #132e2818',
  }}>
    <div style={{width: photoSize, height: photoSize, borderRadius: 14, overflow: 'hidden', flexShrink: 0}}>
      <Img src={staticFile('cedar-dusk.webp')} style={{
        width: '100%', height: '100%', objectFit: 'cover',
        transform: `scale(${1 + .06 * progress(time, moments.recommendation, 12)})`,
      }}/>
    </div>
    <div>
      <div style={{fontSize: 29, fontWeight: 850, letterSpacing: '-.05em'}}>Cedar Dusk</div>
      <div style={{fontSize: 21, color: palette.quiet, fontWeight: 750, marginTop: 5}}>£40.00</div>
    </div>
    <span style={{
      marginLeft: 'auto', alignSelf: 'flex-start', paddingTop: 8, paddingRight: 7,
      fontSize: 15, color: palette.quiet, opacity: 1 - relay, fontWeight: 750,
    }}>WOODY</span>
  </Enter>;
}

function Composer({type, amount}) {
  const web = type === 'web';
  return <div style={{
    position: 'absolute', bottom: 20, left: 24, right: 24, height: 45,
    padding: '0 13px 0 16px', display: 'flex', alignItems: 'center',
    borderRadius: 24, opacity: amount, background: '#ffffffcf', color: palette.quiet, fontSize: 17, fontWeight: 680,
  }}>
    {web ? 'Ask about a product' : 'Message'}
    <span style={{marginLeft: 'auto', color: type === 'telegram' ? palette.telegram : palette.whatsapp}}>
      <Icon name={web ? 'arrow' : 'telegram'} size={20}/>
    </span>
  </div>;
}

function Waveform({time}) {
  const ranges = [[moments.question, moments.question + 1.44], [moments.answer, moments.answer + 2.95]];
  const energy = ranges.reduce((sum, [start, end]) =>
    sum + progress(time, start, start + .08) * (1 - progress(time, end - .23, end)), 0);
  return <div style={{display: 'flex', height: 88, alignItems: 'center', justifyContent: 'center', gap: 6}}>
    {Array.from({length: 33}, (_, i) => {
      const weight = Math.sin(Math.PI * (i + 1) / 34);
      const activity = Math.abs(Math.sin(time * 18 + i * .78) * Math.cos(time * 11 - i * .37));
      return <div key={i} style={{
        width: 5, height: 7 + energy * (6 + 66 * weight * activity),
        background: palette.mint, borderRadius: 5, opacity: .32 + weight * .68,
      }}/>;
    })}
  </div>;
}

function VoiceContent({time, amount}) {
  const elapsed = Math.max(0, Math.floor(time - moments.voice));
  return <Enter amount={amount} style={{position: 'absolute', inset: 0, color: palette.light, textAlign: 'center'}}>
    <div style={{position: 'absolute', top: 32, insetInline: 0, fontSize: 16, letterSpacing: '.16em', fontWeight: 800, color: palette.muted}}>
      VOICE CALL · 00:{String(elapsed).padStart(2, '0')}
    </div>
    <div style={{position: 'absolute', top: 167, insetInline: 0, fontSize: 31, fontWeight: 800}}>Store assistant</div>
    <div style={{position: 'absolute', top: 221, insetInline: 0}}><Waveform time={time}/></div>
    <Enter amount={progress(time, moments.question, moments.question + .24)} style={{
      position: 'absolute', top: 322, insetInline: 22, fontSize: 25, fontWeight: 720,
    }}>“Is Cedar Dusk in stock?”</Enter>
    <Enter amount={progress(time, moments.answer, moments.answer + .24)} style={{
      position: 'absolute', top: 371, insetInline: 22, fontSize: 25, fontWeight: 750, color: palette.mint,
    }}>“Yes, Cedar Dusk is available for £40.”</Enter>
    <div style={{
      position: 'absolute', bottom: 39, left: '50%', translate: '-50% 0', width: 62, height: 62,
      borderRadius: '50%', background: '#a84648', display: 'grid', placeItems: 'center',
    }}><span style={{transform: 'rotate(135deg)'}}><Icon name="voice"/></span></div>
  </Enter>;
}

function ContinuitySurface({time, tracks}) {
  const [open, relay, messenger, call, close] = tracks;
  const rect = tracks.reduce((box, p, i) => morphRect(box, shells[i + 1], p), shells[0]);
  const turn = tracks.reduce((sum, p, i) => sum + Math.sin(Math.PI * p) * [16, -18, 12, -20, 12][i], 0);
  const boot = progress(time, 1.55, moments.core);
  const web = progress(time, moments.web - .32, moments.web + .2) * (1 - progress(relay, 0, .43));
  const whatsapp = progress(relay, .48, .92) * (1 - progress(messenger, 0, .42));
  const telegram = progress(messenger, .48, .95) * (1 - progress(call, 0, .43));
  const voice = progress(call, .6, 1) * (1 - progress(close, 0, .5));

  // The same mark is mounted across the core, all four interfaces, and the closing view.
  const markX = mix(mix(mix(38, 21, open), 212, call), 21, close);
  const markY = mix(mix(mix(38, 17, open), 71, call), 21, close);
  const size = mix(mix(mix(84, 44, open), 86, call), 66, close);
  return <div style={{
    ...boxStyle(rect), zIndex: 3, overflow: 'hidden', opacity: boot,
    background: palette.glass, border: `1px solid ${palette.edge}`,
    transform: `perspective(1000px) rotateY(${turn}deg) rotateX(${turn * -.18}deg) scale(${.82 + boot * .18})`,
    boxShadow: '0 16px 0 -8px #041522, 0 42px 76px #0009, inset 0 1px 1px #f4fff350',
  }}>
    <AbsoluteFill style={{background: '#eaf1ee', opacity: open * (1 - call)}}/>
    <AbsoluteFill style={{background: '#e6ece2', opacity: relay * (1 - messenger) * (1 - call)}}/>
    <AbsoluteFill style={{background: '#dfeaf1', opacity: messenger * (1 - call)}}/>
    <SurfaceHeader type="web" amount={web}/>
    <SurfaceHeader type="whatsapp" amount={whatsapp}/>
    <SurfaceHeader type="telegram" amount={telegram}/>
    <Bubble top={107} ask amount={web * progress(time, 4.55, 4.96)} color={palette.webBubble}>Any woody scents under £45?</Bubble>
    <Enter amount={web * progress(time, 5.59, 5.95)} style={{
      position: 'absolute', left: 26, top: 185, fontSize: 22, color: palette.text, fontWeight: 760,
    }}>Try this one.</Enter>
    <Bubble top={118} ask amount={whatsapp * progress(time, 9.9, 10.24)} color={palette.waBubble}>Is Cedar Dusk in stock?</Bubble>
    <Bubble top={202} amount={whatsapp * progress(time, moments.stock, 11.64)} color={palette.light}>Yes, it’s in stock. <span style={{color: palette.whatsapp}}><Icon name="check" size={16}/></span></Bubble>
    <Bubble top={110} ask amount={telegram * progress(time, 14.94, 15.25)} color={palette.tgBubble}>What are the scent notes?</Bubble>
    <Bubble top={195} amount={telegram * progress(time, moments.notes, 16.53)} color={palette.light}>Cedarwood, sandalwood and vetiver.</Bubble>
    <Product time={time} relay={relay} swap={messenger} dissolve={progress(call, .08, .8)}/>
    <Composer type="web" amount={web}/>
    <Composer type="whatsapp" amount={whatsapp}/>
    <Composer type="telegram" amount={telegram}/>
    <VoiceContent time={time} amount={voice}/>
    <div style={{
      position: 'absolute', left: markX, top: markY, width: size, height: size, borderRadius: size * .3,
      zIndex: 2, display: 'grid', placeItems: 'center', color: palette.mint,
      background: palette.ink, border: `1px solid ${palette.edge}`,
      boxShadow: `0 0 ${10 + 15 * Math.abs(Math.sin(time * 1.9))}px #64ffda28`,
    }}><Icon name="spark" size={size * .54}/></div>
  </div>;
}

const channels = [
  ['Web', 'web', 154, 485],
  ['WhatsApp', 'whatsapp', 566, 485],
  ['Telegram', 'telegram', 154, 758],
  ['Voice', 'voice', 566, 758],
];

function CompletePicture({time}) {
  const settled = progress(time, 24.99, 25.75);
  return <>
    <svg width="720" height="1280" viewBox="0 0 720 1280" style={{position: 'absolute', inset: 0, opacity: settled}}>
      <path d="M360 398 V614" stroke={palette.mint} strokeWidth="2" opacity=".42"/>
      {channels.map(([name, , x, y], i) => {
        const p = progress(time, 25.37 + i * .13, 26.19 + i * .13);
        return <g key={name} opacity={p}>
          <path d={`M360 614 Q${360 + (x - 360) * .8} 614 ${x} ${y}`} fill="none" stroke={palette.mint} strokeWidth="2.4" opacity=".42"/>
          <circle cx={mix(360, x, p)} cy={mix(614, y, p ** 2)} r="5" fill={palette.mint} opacity={Math.sin(Math.PI * p)}/>
        </g>;
      })}
    </svg>
    <Enter amount={settled} style={{position: 'absolute', left: 262, top: 240, width: 196, height: 162}}>
      <Img src={staticFile('store.webp')} style={{width: '100%', height: '100%', objectFit: 'contain'}}/>
    </Enter>
    {channels.map(([name, icon, x, y], index) =>
      <Enter key={name} amount={progress(time, 25.6 + index * .13, 26.2 + index * .13)} style={{
        position: 'absolute', left: x - 80, top: y - 43, width: 160, height: 86,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: palette.mint,
        borderRadius: 19, background: palette.glass, border: `1px solid ${palette.edge}`,
      }}><Icon name={icon} size={25}/><span style={{color: palette.light, fontSize: 19, fontWeight: 800}}>{name}</span></Enter>)}
  </>;
}

export function BusinessStatus({proof = false}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps + (proof ? 17.7 : 0);
  const tracks = channelMoves.map(({from, to}) => progress(time, from, to));
  const [open, relay, messaging, call, close] = tracks;
  const momentum = tracks.reduce((sum, p, i) => sum + Math.sin(p * Math.PI) * [1, -1, .75, -.85, .45][i], 0);
  const cameraX = -18 * open + 31 * relay - 25 * messaging + 12 * call + 20 * momentum;
  const dolly = .96 + .075 * open + .025 * relay - .032 * messaging + .018 * call - .062 * close;
  const startTitle = 1 - progress(time, 1.4, 2.28);
  const assistantTitle = progress(time, 2.32, 2.94) * (1 - progress(time, 3.28, 3.89));
  const closing = progress(time, 26.12, 26.87);
  return <AbsoluteFill style={{overflow: 'hidden', color: palette.light, fontFamily: 'Manrope, sans-serif', background: palette.ink}}>
    <style>{`@font-face{font-family:Manrope;src:url(${staticFile('manrope.woff2')}) format('woff2');font-weight:200 800}*{box-sizing:border-box}`}</style>
    <LoadFont/>
    <StageBackground lean={cameraX} zoom={momentum}/>
    <div style={{
      position: 'absolute', inset: 0, transformOrigin: '360px 622px',
      transform: `translate(${cameraX}px,${momentum * -17}px) scale(${dolly})`,
    }}>
      {time < moments.core && <Business time={time}/>}
      {time >= 24.99 && <CompletePicture time={time}/>}
      <ContinuitySurface time={time} tracks={tracks}/>
    </div>
    <Img src={staticFile('logo.svg')} style={{
      position: 'absolute', top: 106, left: 54, width: 146, opacity: .89,
      filter: 'brightness(0) invert(1)',
    }}/>
    <Enter amount={startTitle} style={{
      position: 'absolute', left: 55, top: 187, fontSize: 68, fontWeight: 800, letterSpacing: '-.065em',
    }}>Your business.</Enter>
    <Enter amount={assistantTitle} style={{
      position: 'absolute', top: 253, insetInline: 42, textAlign: 'center',
      fontSize: 60, fontWeight: 800, letterSpacing: '-.065em',
    }}>One intelligent assistant.</Enter>
    <Enter amount={closing} style={{
      position: 'absolute', left: 54, right: 48, top: 936,
      lineHeight: 1.07, letterSpacing: '-.055em', fontSize: 43, fontWeight: 800,
    }}>One assistant. Your business.<br/><span style={{color: palette.mint}}>Every channel.</span></Enter>
    <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 51%, transparent 66%, #0006)'}}/>
    {!proof && <>
      <Audio src={staticFile('status-score.wav')}/>
      <Sequence from={Math.round(moments.question * fps)}><Audio src={staticFile('status-question.wav')} volume={1}/></Sequence>
      <Sequence from={Math.round(moments.answer * fps)}><Audio src={staticFile('status-answer.wav')} volume={.98}/></Sequence>
    </>}
  </AbsoluteFill>;
}

export const statusFrames = statusDuration * 30;
