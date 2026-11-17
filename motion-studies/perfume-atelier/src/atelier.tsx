import type {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill, Audio, Img, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import clock from './timing.json';
import voiceLevels from './voice-levels.json';
import './atelier.css';

type Channel = 'web' | 'whatsapp' | 'telegram' | 'voice';
const order: Channel[] = ['web', 'whatsapp', 'telegram', 'voice'];
const names = {web: 'Web', whatsapp: 'WhatsApp', telegram: 'Telegram', voice: 'Voice'};
const mint = '#daffdf';
const iris = {x: 360, y: 1086};
const ease = Easing.bezier(.24, .75, .27, 1);
const unit = (frame: number, start: number, duration: number, easing = ease) =>
  interpolate(frame, [start, start + duration], [0, 1], {easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

function Icon({type, size = 25}: {type: Channel | 'mic' | 'speaker' | 'end' | 'send'; size?: number}) {
  const paths = {
    web: 'M3 5h18v14H3z M3 10h18 M6 7.5h1 M10 7.5h1',
    whatsapp: 'M20.5 11.4a8.3 8.3 0 0 1-12.3 7.5L4 20l1.1-4a8.3 8.3 0 1 1 15.4-4.6Z M9 8.5c-.7.5-.6 2.2.8 3.9 1.5 1.6 3.2 2.4 4.3 2 .8-.3.9-1 .8-1.3l-2.1-1-.7.7a5.5 5.5 0 0 1-1.9-2l.6-.7-.9-1.8c-.2-.2-.5-.2-.9.2Z',
    telegram: 'M3 10.4 21 4l-3.7 16-5.4-4.4-2.7 2 .3-4.4L17 7.9 7.7 12.5z',
    voice: 'M6.6 3.5 9.6 8l-1.8 2c1.4 2.8 3.3 4.7 6.1 6.1l2-1.8 4.6 3c.1.5-.1 1.6-.8 2.4-1.5 1.7-5 .9-8.4-1.4A23 23 0 0 1 5 11.7C2.9 8.3 2.6 5 4.3 4c.7-.4 1.6-.6 2.3-.5Z',
    mic: 'M10 5a2 2 0 1 1 4 0v7a2 2 0 0 1-4 0z M7 11v1a5 5 0 0 0 10 0v-1 M12 17v4 M9 21h6',
    speaker: 'M3 9h4l5-4v14l-5-4H3z M16 9a4 4 0 0 1 0 6 M19 6a8 8 0 0 1 0 12',
    end: 'M3 14c-.4-1.2.1-2.3 1.4-3.2a14.6 14.6 0 0 1 15.2 0c1.3.9 1.8 2 1.4 3.2-.3 1-1 1.3-2 1l-3-.7-.4-2a11 11 0 0 0-7.2 0l-.4 2-3 .7c-1 .3-1.7 0-2-1Z',
    send: 'M3 11.7 20.9 4l-4.4 16-5.8-4.5L20.9 4',
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[type]}/></svg>;
}

function Seal({size = 56}: {size?: number}) {
  return <div className="seal" style={{width: size, height: size}}>
    <svg width={size * .56} height={size * .56} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 3c0 9.4 7.6 17 17 17-9.4 0-17 7.6-17 17 0-9.4-7.6-17-17-17 9.4 0 17-7.6 17-17Z" stroke={mint} strokeWidth="2"/>
      <circle cx="20" cy="20" r="3.5" fill={mint}/>
    </svg>
  </div>;
}

function Lift({frame, at, children, className}: {frame: number; at: number; children: ReactNode; className?: string}) {
  const rise = unit(frame, at, 14);
  return <div className={className} style={{opacity: rise, transform: `translateY(${(1 - rise) * 23}px)`}}>{children}</div>;
}

function Artwork({frame}: {frame: number}) {
  const move = unit(frame, 0, 112, Easing.bezier(.3, .13, .45, 1));
  return <>
    <Img src={staticFile('art/counter.webp')} className="artwork"
      style={{transform: `translate(${-9 * move}px,${-8 * move}px) scale(${1 + move * .078})`}} />
    <div className="hero-grade" />
  </>;
}

function Hero({frame}: {frame: number}) {
  const collect = unit(frame, 39, 35);
  const pulse = unit(frame, 76, 22);
  const clear = 1 - unit(frame, 90, 14);
  return <AbsoluteFill className="hero">
    <Artwork frame={frame}/>
    <header className="hero-title" style={{opacity: clear}}>
      <div className="eyebrow">FRAGRANCE RETAIL</div>
      <h1>The perfume<br/>counter.</h1>
    </header>
    <div className="seal-stage">
      <div className="seal-halo" style={{opacity: .55 * Math.sin(Math.PI * pulse), scale: String(1 + 1.55 * pulse)}}/>
      <div style={{opacity: collect, scale: String(.78 + collect * .22 - pulse * .07)}}><Seal size={64}/></div>
    </div>
    <div className="hero-source" style={{opacity: collect * clear}}>Catalogue <b>·</b> Stock <b>·</b> Scent notes</div>
  </AbsoluteFill>;
}

const conversation = {
  web: {label: 'Find a fragrance', question: 'A woody scent under £45?', reply: 'I’d suggest Cedar Dusk. It’s £40.'},
  whatsapp: {label: 'Check stock', question: 'Do you have Emberwood?', reply: 'Yes, Emberwood is in stock.'},
  telegram: {label: 'Explore the notes', question: 'What are Emberwood’s notes?', reply: 'Rich oud, earthy patchouli and warm amber.'},
};

function ProductTile({channel, frame}: {channel: keyof typeof conversation; frame: number}) {
  const cedar = channel === 'web';
  const telegram = channel === 'telegram';
  const title = cedar ? 'Cedar Dusk' : 'Emberwood';
  const at = clock[channel].result;
  return <Lift frame={frame} at={at} className="product-wrap">
    <div className="product">
      <Img src={staticFile(cedar ? 'art/cedar.webp' : 'art/ember.webp')} alt={title}/>
      <div className="product-content">
        <div className="product-name">{title}</div>
        {cedar && <><div className="product-detail">Woody · Cedar and vetiver</div><strong>£40</strong></>}
        {channel === 'whatsapp' && <div className="in-stock"><span />In stock</div>}
        {telegram && <div className="notes">{['Oud', 'Patchouli', 'Amber'].map((note, i) =>
          <span key={note} style={{opacity: unit(frame, at + 7 + i * 4, 8)}}>{note}</span>)}</div>}
      </div>
    </div>
  </Lift>;
}

function Inbox({frame, channel}: {frame: number; channel: keyof typeof conversation}) {
  const {label, question, reply} = conversation[channel];
  const {question: typeAt, send, reply: replyAt} = clock[channel];
  const typed = unit(frame, typeAt, send - typeAt, Easing.linear);
  const sent = frame >= send;
  const browser = channel === 'web';
  return <AbsoluteFill className={`scene ${channel}`}>
    <div className="studio-shade"/>
    <header className="scene-heading">
      <div className="eyebrow"><Icon type={channel} size={20}/>{names[channel]}</div>
      <h2>{label}</h2>
    </header>
    <div className={`interface ${browser ? 'browser' : 'chat'}`}>
      {browser && <div className="browser-bar"><i/><i/><i/><span>Fragrance counter</span></div>}
      <div className="platform-bar">
        <Seal size={47}/>
        <div><strong>Fragrance assistant</strong><div>{browser ? 'Online shop' : 'Business chat'}</div></div>
        <Icon type={channel} size={28}/>
      </div>
      <div className="chat-body">
        <Lift frame={frame} at={send} className="out-wrap">
          <div className="bubble outgoing">{question}<span className="ticks">{browser ? '' : '✓✓'}</span></div>
        </Lift>
        <Lift frame={frame} at={replyAt} className="incoming">
          <Seal size={37}/><div className="bubble reply">{reply}</div>
        </Lift>
        <ProductTile channel={channel} frame={frame}/>
      </div>
      <div className="compose">
        <span className={!sent && typed > 0 ? 'typing' : ''}>{sent || !typed ? (browser ? 'Ask about a fragrance' : 'Message') : question.slice(0, Math.max(1, Math.round(typed * question.length)))}</span>
        <span className="send" style={{scale: String(1 - .2 * Math.sin(Math.PI * unit(frame, send - 3, 9)))}}><Icon type="send" size={23}/></span>
      </div>
    </div>
    <div className="seal-stage interface-seal"><Seal size={64}/></div>
  </AbsoluteFill>;
}

function Voice({frame}: {frame: number}) {
  const {start, question, answer, confirm} = clock.voice;
  const position = frame < answer ? frame - question : frame - answer;
  const levels = frame < answer ? voiceLevels.question : voiceLevels.answer;
  const level = levels[position] ?? 0;
  const seconds = Math.max(0, Math.floor((frame - start - 12) / clock.fps));
  return <AbsoluteFill className="scene voice">
    <div className="studio-shade"/>
    <header className="scene-heading">
      <div className="eyebrow"><Icon type="voice" size={20}/>Voice</div>
      <h2>Arrange pickup</h2>
    </header>
    <div className="interface call">
      <div className="call-timer">ON THE CALL · 00:{String(seconds).padStart(2, '0')}</div>
      <Seal size={102}/>
      <div className="call-title">Fragrance assistant</div>
      <div className="wave" aria-hidden="true">{Array.from({length: 39}, (_, i) => {
        const focus = Math.sin(Math.PI * (i + 1) / 40);
        const flicker = .26 + .74 * Math.abs(Math.sin(frame * .62 + i * 1.27));
        return <i key={i} style={{height: 4 + (5 + level * 57 * flicker) * focus, opacity: .48 + .52 * focus}}/>;
      })}</div>
      <div className="transcript">
        <Lift frame={frame} at={question}>“Can I collect today?”</Lift>
        <Lift frame={frame} at={answer}><strong>“Yes, we’re open until six.”</strong></Lift>
      </div>
      <Lift frame={frame} at={confirm} className="collection"><span>✓</span> Pickup today · until 6 pm</Lift>
      <div className="call-controls">
        <i><Icon type="mic" size={27}/></i><i><Icon type="speaker" size={26}/></i><i><Icon type="end" size={31}/></i>
      </div>
    </div>
    <div className="seal-stage interface-seal"><Seal size={64}/></div>
  </AbsoluteFill>;
}

function Finale({frame}: {frame: number}) {
  const at = clock.finale;
  const title = 1 - unit(frame, clock.returnToStart - 11, 11);
  const lift = `translateY(${-57 * unit(frame, at + 22, 23)}px)`;
  return <AbsoluteFill className="hero finale">
    <Artwork frame={112 - 54 * unit(frame, at, 90)}/>
    <div className="final-shade"/>
    <header className="hero-title" style={{opacity: title}}>
      <Lift frame={frame} at={at + 5}><div className="eyebrow">THE CONNECTED COUNTER</div><h1>One assistant.<br/>Four ways to ask.</h1></Lift>
    </header>
    <div className="seal-stage" style={{transform: lift}}>
      <Lift frame={frame} at={at + 5}><Seal size={64}/></Lift>
    </div>
    <div className="dock" style={{transform: lift}}>
      {order.map((channel, i) => <Lift key={channel} frame={frame} at={at + 11 + i * 5}>
        <div className="channel"><Icon type={channel} size={24}/><span>{names[channel]}</span></div>
      </Lift>)}
    </div>
  </AbsoluteFill>;
}

function Scene({index, frame}: {index: number; frame: number}) {
  if (index === 0) return <Hero frame={frame}/>;
  if (index === 5) return <Finale frame={frame}/>;
  if (index === 4) return <Voice frame={frame}/>;
  return <Inbox frame={frame} channel={order[index - 1] as keyof typeof conversation}/>;
}

const starts = [0, clock.iris[0], clock.whatsapp.start, clock.telegram.start, clock.voice.start, clock.finale];
const handoff = [0, clock.iris[1] - clock.iris[0], 16, 16, 17, 24];

function Cut({index, frame}: {index: number; frame: number}) {
  if (index === 0) return <Hero frame={frame}/>;
  const movement = unit(frame, starts[index], handoff[index], Easing.bezier(.55, .03, .3, 1));
  if (movement === 1) return <Scene index={index} frame={frame}/>;
  // The visible seal, both mattes and the camera pivot share one project-space centre.
  const radial = index === 1 || index === 5;
  const radius = 29 + 1173 * movement;
  const flip = index === 3 ? -1 : 1;
  const edge = movement * 116 - 10;
  const mask = radial ? `circle(${radius}px at ${iris.x}px ${iris.y}px)` : undefined;
  const matte = radial ? undefined : `linear-gradient(${flip > 0 ? 'to left' : 'to right'},black ${edge - 1.8}%,transparent ${edge + 1.8}%)`;
  const incoming: CSSProperties = {clipPath: mask, maskImage: matte};
  const drift = radial ? `scale(${1 + .10 * movement})` : `translateX(${-flip * 78 * movement}px) scale(${1 + .035 * movement})`;
  return <>
    <AbsoluteFill style={{transform: drift, transformOrigin: radial ? `${iris.x}px ${iris.y}px` : 'center'}}>
      <Scene index={index - 1} frame={frame}/>
    </AbsoluteFill>
    <AbsoluteFill style={incoming}><Scene index={index} frame={frame}/></AbsoluteFill>
    {radial && <div className="shutter-ring" style={{
      top: iris.y - radius, left: iris.x - radius, width: radius * 2, height: radius * 2,
      opacity: .88 * Math.sin(Math.PI * movement),
    }}/>}
  </>;
}

export function Atelier() {
  const frame = useCurrentFrame();
  const index = starts.filter((start) => frame >= start).length - 1;
  const restart = unit(frame, clock.returnToStart, clock.frames - clock.returnToStart - 2);
  return <AbsoluteFill className="film">
    <Cut index={index} frame={frame}/>
    {restart > 0 && <AbsoluteFill style={{opacity: restart}}><Hero frame={0}/></AbsoluteFill>}
    <Img className="freemancodz" src={staticFile('art/freemancodz.svg')} alt="Freemancodz"/>
    <Audio src={staticFile('audio/mix.wav')}/>
  </AbsoluteFill>;
}
