import React from 'react';
import {Img, staticFile} from 'remotion';
import {progress} from '../../../../skills/freemancodz-motion/assets/motion.mjs';

export const theme = {
  ink: '#020c1b',
  navy: '#0a192f',
  midnight: '#061222',
  teal: '#123c42',
  mint: '#64ffda',
  paper: '#f6f7f4',
  warm: '#e6c098',
  white: '#fff',
  text: '#16252b',
  secondary: '#516469',
  muted: '#adc3ca',
  line: '#b0eee348',
  whatsapp: '#10594c',
  message: '#e1ebdf',
  waBubble: '#d1f3c7',
  telegram: '#1f5c86',
  tgGlass: '#e6f0f6',
  tgBubble: '#ceeaff',
};

const paths = {
  assistant: 'M12 2v20M2 12h20M5 5l14 14M19 5L5 19',
  web: 'M3 5h18v14H3zM3 9h18M6 7h.1M9 7h.1',
  whatsapp: 'M4.5 17l-1 3.5L7 19a8 8 0 1 0-2.5-2zM8 8l2-1 1 2-1 1c1 2 2 3 4 4l1-1 2 1-1 2c-4 1-9-4-8-8z',
  telegram: 'M3 11l18-7-5 16-5-6zM11 14L21 4',
  voice: 'M6 3l4 4-2 3a12 12 0 0 0 6 6l3-2 4 4-2 3C11 22 2 13 3 6z',
  mic: 'M9 6a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM6 11v1a6 6 0 0 0 12 0v-1M12 18v3M9 21h6',
  catalog: 'M4 8l8-4 8 4v9l-8 4-8-4zM4 8l8 4 8-4M12 12v9',
  faq: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
  inventory: 'M4 5h16v14H4zM4 10h16M9 10v9M14 5v5',
  ops: 'M5 4h14v16H5zM8 9l2 2 5-5M8 15h8',
  check: 'M4 12l4 4 9-9m-5 9 8-9',
  back: 'M15 5l-7 7 7 7',
};

export function Icon({name, size = 25}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={paths[name]} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

export function Mark({size = 46}) {
  return <div style={{
    width: size, height: size, borderRadius: size * .31, flexShrink: 0,
    display: 'grid', placeItems: 'center', color: theme.mint,
    background: 'linear-gradient(145deg, #174b4d, #081a2a 76%)',
    border: `1px solid ${theme.line}`, boxShadow: '0 12px 24px #020c1b52, inset 0 1px 1px #ffffff22',
  }}><Icon name="assistant" size={size * .52}/></div>;
}

export function Rise({time, at, children, style, distance = 26, duration = .48}) {
  const p = progress(time, at, at + duration);
  return <div style={{
    ...style, opacity: p, transform: `translateY(${distance * (1 - p)}px) scale(${.965 + .035 * p})`,
  }}>{children}</div>;
}

export function Brand() {
  return <Img src={staticFile('logo.svg')} style={{
    position: 'absolute', top: 106, left: 55, width: 149,
    filter: 'brightness(0) invert(1)', opacity: .95,
  }}/>;
}

export function ProductImage({style, item}) {
  return <Img src={staticFile(item.photo)} style={{objectFit: item.photoFit, background: theme.midnight, ...style}}/>;
}
