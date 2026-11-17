import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Composition, Img, continueRender, delayRender,
  cancelRender, registerRoot, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {boxStyle, mix, morphRect, progress} from '../../../skills/freemancodz-motion/assets/motion.mjs';
import {beats} from './score.mjs';
import {BusinessStatus, statusFrames} from './status.jsx';
import {NewBusinessFilm} from './film/index.jsx';
import {format} from './film/timing.mjs';

const colors = {
  night: '#020c1b', mint: '#64ffda', pearl: '#f2f6f4',
  white: '#fff', steel: '#95aeb6', text: '#0a2330',
};
const core = {x: 286, y: 553, width: 148, height: 148, radius: 39};
const web = {x: 72, y: 397, width: 576, height: 415, radius: 29};
const inbox = {x: 106, y: 372, width: 508, height: 490, radius: 39};

function BrandFont() {
  const [handle] = useState(() => delayRender('Load Manrope'));
  useEffect(() => {
    document.fonts.load('750 40px Manrope').then(() => continueRender(handle), cancelRender);
  }, [handle]);
  return null;
}

function Symbol({type, size = 34}) {
  const paths = {
    catalog: 'M4 8l8-4 8 4v9l-8 4-8-4z M4 8l8 4 8-4 M12 12v9',
    answers: 'M4 5h16v11H9l-5 4z M8 9h8 M8 12h5',
    stock: 'M4 5h16v14H4z M4 10h16 M9 10v9 M14 5v5',
    spark: 'M12 2v20 M2 12h20 M5 5l14 14 M19 5L5 19',
    send: 'M3 11l18-7-5 16-5-6z M11 14L21 4',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={paths[type]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

const sources = [
  {title: 'Catalog', type: 'catalog', x: 65, y: 728},
  {title: 'FAQs', type: 'answers', x: 442, y: 440},
  {title: 'Inventory', type: 'stock', x: 441, y: 751},
];

function Business({time}) {
  const depart = progress(time, 0.85, 2.1);
  const settle = progress(time, 0, 1.2);
  return <>
    <div style={{
      position: 'absolute', left: 74, top: 355, width: 558, height: 478,
      opacity: 1 - depart,
      transform: `translate(-${depart * 220}px, ${depart * 48}px) scale(${0.94 + settle * 0.06 - depart * 0.22})`,
    }}>
      <div style={{
        position: 'absolute', top: '78%', left: 35, width: 495, height: 112,
        background: 'radial-gradient(ellipse, #23837455, transparent 70%)',
      }}/>
      <Img src={staticFile('store.webp')} style={{width: '100%', height: '100%', objectFit: 'contain'}}/>
    </div>
    {sources.map((item, index) => {
      const gather = progress(time, beats.gather + index * .13, beats.assembled - .17 + index * .08);
      const enter = .65 + .35 * progress(time, index * .09, .38 + index * .09);
      return <div key={item.type} style={{
        position: 'absolute', left: mix(item.x, 279, gather), top: mix(item.y, 596, gather),
        width: 164, height: 61, display: 'flex', alignItems: 'center', gap: 11, paddingLeft: 15,
        color: colors.mint, background: '#102c3c', border: '1px solid #478279', borderRadius: 15,
        boxShadow: '0 14px 28px #0007', zIndex: 2,
        transform: `scale(${mix(enter, .44, gather)})`,
        opacity: enter * (1 - progress(gather, .78, 1)),
      }}>
        <Symbol type={item.type} size={21}/>
        <span style={{fontSize: 22, fontWeight: 750, color: colors.pearl}}>{item.title}</span>
      </div>;
    })}
  </>;
}

function SharedSurface({time}) {
  const boot = progress(time, .95, beats.assembled);
  const open = progress(time, 1.98, beats.web);
  const relay = progress(time, beats.transfer, beats.inbox);
  const rect = morphRect(morphRect(core, web, open), inbox, relay);
  const markLeft = mix(37, 22, open);
  const markTop = mix(37, 16, open);
  const markSize = mix(74, 45, open);
  const read = progress(time, 2.87, 3.28);
  const webText = read * (1 - progress(time, 5.28, 5.59));
  const messageText = progress(time, 5.85, 6.24);
  const response = progress(time, beats.result - .16, beats.result + .28);
  const transfer = progress(time, 5.36, 6.16);
  const photoBox = morphRect(
    {x: 22, y: 229, width: 134, height: 133, radius: 13},
    {x: 22, y: 281, width: 103, height: 102, radius: 12}, transfer,
  );

  return <div style={{
    ...boxStyle(rect), overflow: 'hidden', opacity: boot,
    zIndex: 1, border: '1px solid #5d9c9355',
    background: 'linear-gradient(145deg, #27574e, #10303e 60%, #091c2a)',
    boxShadow: '0 18px 0 -8px #071923, 0 38px 70px #0009, inset 0 1px 1px #e8fff543',
    transform: `perspective(1100px) rotateY(${-12 * Math.sin(Math.PI * open) + 19 * Math.sin(Math.PI * relay)}deg) scale(${.79 + .21 * boot})`,
  }}>
    <div style={{position: 'absolute', inset: 0, background: colors.pearl, opacity: open}}/>
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      border: '2px solid #64ffda', borderRadius: rect.radius,
      opacity: .62 * Math.sin(Math.PI * open),
      boxShadow: 'inset 0 0 22px #64ffda33',
    }}/>
    <div style={{position: 'absolute', inset: 0, background: '#dae9e2', opacity: relay}}/>
    <div style={{position: 'absolute', height: 79, insetInline: 0, top: 0, background: '#155347', opacity: relay}}/>
    <div style={{
      position: 'absolute', left: markLeft, top: markTop, width: markSize, height: markSize, zIndex: 2,
      borderRadius: 13, display: 'grid', placeItems: 'center',
      color: colors.mint, background: colors.night, border: '1px solid #6acdb47b',
    }}><Symbol type="spark" size={mix(42, 24, open)}/></div>
    <div style={{
      position: 'absolute', left: 80, right: 22, top: 22,
      opacity: read, fontSize: 28, fontWeight: 800, letterSpacing: '-.03em',
      color: relay > .56 ? colors.white : colors.text,
    }}>Store assistant</div>
    <div style={{
      position: 'absolute', right: 22, top: 22, opacity: webText,
      color: '#49616a', fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10,
    }}><span style={{letterSpacing: 3, color: '#448374'}}>●●●</span><span style={{padding: '4px 9px', borderRadius: 8, background: '#dfe8e4'}}>WEB</span></div>
    <div style={{
      position: 'absolute', right: 22, top: 28, opacity: messageText,
      color: colors.white, fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6,
    }}><Symbol type="answers" size={22}/> Messages</div>
    <div style={{
      position: 'absolute', right: 22, top: 101, padding: '15px 21px', borderRadius: 19,
      background: '#c9eadc', color: colors.text, fontWeight: 750, fontSize: 27, opacity: webText,
    }}>A woody fragrance?</div>
    <div style={{
      position: 'absolute', right: 22, top: 107, padding: '15px 21px', borderRadius: 19,
      background: '#baf1d9', color: colors.text, fontWeight: 750, fontSize: 29, opacity: messageText,
    }}>Is it in stock?</div>
    <div style={{
      position: 'absolute', left: 22, right: 22, top: mix(197, 252, transfer), height: 185,
      borderRadius: 18, background: colors.white, opacity: response,
      boxShadow: '0 4px 16px #152f1e13',
    }}/>
    <div style={{...boxStyle(photoBox), overflow: 'hidden', opacity: response}}>
      <Img src={staticFile('cedar-dusk.webp')} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
    </div>
    <div style={{
      position: 'absolute', left: mix(179, 147, transfer), top: mix(251, 290, transfer),
      color: colors.text, opacity: response, fontSize: 31, fontWeight: 800,
    }}>Cedar Dusk<div style={{fontSize: 24, marginTop: 7, fontWeight: 650}}>£40</div></div>
    <div style={{
      position: 'absolute', left: 22, top: 194, color: colors.text, fontSize: 24,
      fontWeight: 750, opacity: progress(time, beats.received - .10, beats.received + .22),
    }}>Yes, it’s in stock.</div>
    <div style={{
      position: 'absolute', right: 32, bottom: 19, opacity: messageText, color: '#176a57',
    }}><Symbol type="send" size={28}/></div>
  </div>;
}

function Film({proof = false}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps + (proof ? 1.75 : 0);
  const lean = progress(time, .15, 2.3) - progress(time, 5.55, 7.1);
  const zoom = progress(time, 1.6, 3.5) - .67 * progress(time, 5.44, 6.85);
  const intro = 1 - progress(time, 1.12, 1.74);
  const middle = progress(time, 1.35, 1.95) * (1 - progress(time, 2.43, 3.03));
  const end = progress(time, 6.8, 7.35);
  return <AbsoluteFill style={{overflow: 'hidden', color: colors.pearl, fontFamily: 'Manrope, sans-serif', background: colors.night}}>
    <style>{`@font-face{font-family:Manrope;src:url(${staticFile('manrope.woff2')}) format('woff2');font-weight:200 800}*{box-sizing:border-box}`}</style>
    <BrandFont/>
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at ${48 + lean * 6}% 48%, #205159 0%, #0b2638 33%, #020c1b 76%)`,
    }}/>
    <svg width="720" height="1280" style={{position: 'absolute', transform: `translateX(${lean * -23}px)`}}>
      <defs><radialGradient id="falloff"><stop offset="0" stopColor="white"/><stop offset="1" stopColor="black"/></radialGradient>
        <mask id="light"><rect width="720" height="1280" fill="url(#falloff)"/></mask></defs>
      <g stroke="#6abaa9" strokeOpacity=".22" fill="none" mask="url(#light)">
        {[155, 212, 271, 333, 400, 475, 565].map((radius) =>
          <ellipse key={radius} cx="360" cy="710" rx={radius} ry={radius * .46} />)}
        <path d="M0 925l720-360M0 728l720 150M360 417v620"/>
      </g>
    </svg>
    <div style={{
      position: 'absolute', inset: 0, transformOrigin: '360px 625px',
      transform: `translate(${lean * -12}px, ${lean * -20}px) scale(${1 + zoom * .09})`,
    }}>
      <Business time={time}/>
      <SharedSurface time={time}/>
    </div>
    <Img src={staticFile('logo.svg')} style={{position: 'absolute', top: 98, left: 56, width: 145, filter: 'brightness(0) invert(1)', opacity: .85}}/>
    <div style={{
      position: 'absolute', top: 183, left: 56, maxWidth: 620, fontSize: 72,
      letterSpacing: '-.065em', lineHeight: .99, fontWeight: 800, opacity: intro,
      transform: `translateY(${-25 * (1 - intro)}px)`,
    }}>Your business.</div>
    <div style={{
      position: 'absolute', top: 261, insetInline: 55, textAlign: 'center', fontSize: 56,
      letterSpacing: '-.05em', fontWeight: 800, opacity: middle,
      transform: `translateY(${12 * (1 - middle)}px)`,
    }}>One assistant.</div>
    <div style={{
      position: 'absolute', left: 56, right: 56, top: 959, fontSize: 49,
      letterSpacing: '-.06em', lineHeight: 1.04, fontWeight: 800, opacity: end,
      transform: `translateY(${18 * (1 - end)}px)`,
    }}>One assistant.<br/><span style={{color: colors.mint}}>Wherever they ask.</span></div>
    <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 66%, #0005)'}}/>
    {!proof && <Audio src={staticFile('score.wav')}/>}
  </AbsoluteFill>;
}

registerRoot(() => <>
  <Composition id="FreemancodzPhoneFilm" component={NewBusinessFilm} defaultProps={{business: 'phone'}} width={format.width} height={format.height} fps={format.fps} durationInFrames={Math.round(format.seconds * format.fps)}/>
  <Composition id="FreemancodzFilm" component={NewBusinessFilm} width={format.width} height={format.height} fps={format.fps} durationInFrames={Math.round(format.seconds * format.fps)}/>
  <Composition id="FilmHandoff" component={NewBusinessFilm} defaultProps={{proof: true}} width={format.width} height={format.height} fps={format.fps} durationInFrames={110}/>
  <Composition id="BusinessStatus" component={BusinessStatus} width={720} height={1280} fps={30} durationInFrames={statusFrames}/>
  <Composition id="StatusHandoff" component={BusinessStatus} defaultProps={{proof: true}} width={720} height={1280} fps={30} durationInFrames={66}/>
  <Composition id="BusinessMotion" component={Film} width={720} height={1280} fps={30} durationInFrames={240}/>
  <Composition id="HandoffProof" component={Film} defaultProps={{proof: true}} width={720} height={1280} fps={30} durationInFrames={60}/>
</>);
