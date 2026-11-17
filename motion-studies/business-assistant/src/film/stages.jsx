import React from 'react';
import {Img, staticFile} from 'remotion';
import {Icon, Mark, Rise, theme} from './visual.jsx';
import {beats} from './timing.mjs';
import {mix, progress} from '../../../../skills/freemancodz-motion/assets/motion.mjs';

export function Opening({time}) {
  const push = progress(time, 0, beats.core);
  const title = 1 - progress(time, beats.core - .48, beats.core - .2);
  return <>
    <Img src={staticFile('film-bottle.webp')} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
      transform: `translate(${-11 * push}px,${-6 * push}px) scale(${1.035 + .075 * push})`,
    }}/>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg,#020c1b55,transparent 43%,transparent 64%,#020c1bb8 88%,#020c1b)',
    }}/>
    <div style={{opacity: title}}><Rise time={time} at={-.21} style={{
      position: 'absolute', top: 174, left: 54, right: 58, fontSize: 64,
      lineHeight: 1.02, letterSpacing: '-.062em', fontWeight: 800,
    }}>Your shop.<br/><span style={{color: theme.mint}}>One assistant.</span></Rise></div>
    <Rise time={time} at={.8} style={{
      position: 'absolute', left: 55, right: 55, top: 1006, paddingTop: 19,
      borderTop: '1px solid #f4c3925c', display: 'flex', justifyContent: 'space-between',
      fontSize: 22, fontWeight: 780, color: theme.warm,
    }}><span>Cedar Dusk</span><span>£40.00</span></Rise>
  </>;
}

const inputs = [
  {name: 'Products', icon: 'catalog', x: 150, y: 488},
  {name: 'FAQs', icon: 'faq', x: 568, y: 488},
  {name: 'Inventory', icon: 'inventory', x: 150, y: 792},
  {name: 'Operations', icon: 'ops', x: 568, y: 792},
];

function HubLines({time, links, start, color}) {
  return <svg width="720" height="1280" style={{position: 'absolute', inset: 0}} aria-hidden="true">
    {links.map(({name, x, y}, i) => {
      const phase = progress(time, start + i * .08, start + .56 + i * .08);
      const bend = (x - 360) * .48;
      // The signal follows the same quadratic path as the illuminated link.
      const u = 1 - phase;
      const px = u * u * 360 + 2 * u * phase * (360 + bend) + phase * phase * x;
      const py = (u * u + 2 * u * phase) * 640 + phase * phase * y;
      return <g key={name} opacity={phase}>
        <path d={`M360 640 Q${360 + bend} 640 ${x} ${y}`}
          fill="none" stroke={color} strokeWidth="2" strokeOpacity=".57"/>
        <circle cx={px} cy={py} r="6" fill={color} opacity={Math.sin(Math.PI * phase)}/>
      </g>;
    })}
  </svg>;
}

function LinkTile({time, at, node}) {
  const {name, icon, x, y} = node;
  return <Rise time={time} at={at} distance={13} style={{
    position: 'absolute', left: x - 88, top: y - 39, width: 176, height: 78,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
    color: theme.mint, borderRadius: 20, border: `1px solid ${theme.line}`,
    background: 'linear-gradient(145deg,#153747,#0d2132)', boxShadow: '0 14px 35px #0006',
  }}><Icon size={25} name={icon}/><span style={{fontSize: 20, fontWeight: 800, color: theme.paper}}>{name}</span></Rise>;
}

export function Hub({time}) {
  const pulse = Math.sin((time - beats.core) * 2.4);
  return <>
    <div style={{opacity: 1 - progress(time, beats.web - .44, beats.web - .15)}}><Rise time={time} at={beats.core + .04} style={{
      position: 'absolute', top: 221, left: 54, right: 54, fontSize: 55,
      letterSpacing: '-.06em', fontWeight: 800,
    }}>Your business, connected.</Rise></div>
    <HubLines time={time} links={inputs} start={beats.core + .37} color={theme.mint}/>
    <div style={{
      position: 'absolute', top: 457, left: 177, width: 366, height: 366,
      borderRadius: '50%', border: `1px solid ${theme.line}`,
      background: 'radial-gradient(circle, #64ffda26, #020c1b00 69%)',
      transform: `scale(${1 + .028 * pulse})`,
    }}/>
    {inputs.map((node, i) => <LinkTile key={node.name} node={node} time={time} at={beats.core + .18 + i * .14}/>)}
    <Rise time={time} at={beats.core + .42} style={{position: 'absolute', left: 297, top: 577}}><Mark size={126}/></Rise>
    <Rise time={time} at={beats.core + .75} style={{
      position: 'absolute', top: 915, insetInline: 54, textAlign: 'center',
      fontSize: 26, fontWeight: 740, color: theme.muted,
    }}>One source for every answer.</Rise>
  </>;
}

const channelLinks = [
  {name: 'Web', icon: 'web', x: 148, y: 476},
  {name: 'WhatsApp', icon: 'whatsapp', x: 572, y: 476},
  {name: 'Telegram', icon: 'telegram', x: 148, y: 785},
  {name: 'Voice', icon: 'voice', x: 572, y: 785},
];

export function Closing({time}) {
  const settle = progress(time, beats.network, beats.network + .65);
  return <>
    <Rise time={time} at={beats.network + .04} style={{
      position: 'absolute', left: 54, right: 54, top: 192, fontSize: 55, fontWeight: 850,
      letterSpacing: '-.06em', lineHeight: 1.07,
    }}>One assistant.<br/>Your business.<br/><span style={{color: theme.mint}}>Every channel.</span></Rise>
    <HubLines time={time} links={channelLinks} start={beats.network + .37} color={theme.mint}/>
    {channelLinks.map((node, i) => <LinkTile key={node.name} node={node} time={time} at={beats.network + .44 + .15 * i}/>)}
    <div style={{
      position: 'absolute', left: 271, top: 551, width: 178, height: 178,
      borderRadius: 56, background: 'linear-gradient(145deg,#1e6058,#081725 72%)',
      boxShadow: '0 22px 0 -10px #051725, 0 40px 55px #0008',
      border: `1px solid ${theme.line}`, display: 'grid', placeItems: 'center',
      scale: mix(.84, 1, settle), opacity: settle,
    }}><Mark size={118}/></div>
    <Rise time={time} at={beats.network + 1.19} style={{
      position: 'absolute', left: 54, right: 54, top: 975, paddingTop: 21,
      color: theme.muted, fontSize: 24, fontWeight: 740, borderTop: `1px solid ${theme.line}`,
    }}>Wherever customers already are.</Rise>
  </>;
}
