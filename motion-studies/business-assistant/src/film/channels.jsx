import React from 'react';
import {Icon, Mark, ProductImage, Rise, theme} from './visual.jsx';
import {beats, handoffs, reveals} from './timing.mjs';
import {progress} from '../../../../skills/freemancodz-motion/assets/motion.mjs';

const frameShadow = '0 58px 100px #010511a3, 0 14px 26px #0005';

function ChannelHeading({time, at, children}) {
  const next = handoffs.find(({at: change}) => change > at);
  const leave = 1 - progress(time, next.at - .45, next.at - .15);
  return <div style={{opacity: leave}}><Rise time={time} at={at} style={{
    position: 'absolute', top: 216, left: 56, right: 54,
    fontWeight: 800, fontSize: 51, lineHeight: 1.05, letterSpacing: '-.061em',
  }}>{children}</Rise></div>;
}

function Prompt({children, tone}) {
  return <div style={{
    marginLeft: 'auto', width: 'fit-content', maxWidth: '95%',
    fontSize: 25, fontWeight: 750, lineHeight: 1.2, color: theme.text,
    padding: '15px 19px', background: tone, borderRadius: '22px 22px 6px 22px',
  }}>{children}</div>;
}

function Reply({children}) {
  return <div style={{display: 'flex', gap: 12, alignItems: 'flex-end'}}>
    <Mark size={29}/>
    <div style={{
      fontSize: 24, fontWeight: 740, lineHeight: 1.2, color: theme.text,
      padding: '13px 16px', background: theme.white, borderRadius: '21px 21px 21px 6px',
    }}>{children}</div>
  </div>;
}

export function Web({time}) {
  const {question, reply, product} = reveals.web;
  const enlarge = progress(time, product, product + 1.8);
  return <>
    <ChannelHeading time={time} at={beats.web + .04}>Find the right product.</ChannelHeading>
    <div style={{
      position: 'absolute', left: 48, top: 345, width: 624, height: 610,
      borderRadius: 30, overflow: 'hidden', background: theme.paper, color: theme.text,
      boxShadow: frameShadow, border: '1px solid #dce9e7',
    }}>
      <div style={{
        height: 55, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 20,
        background: '#e5eae6', borderBottom: '1px solid #c9d5d2',
      }}>
        <span style={{color: '#47837a', fontSize: 14, letterSpacing: 4}}>●●●</span>
        <span style={{
          flex: 1, textAlign: 'center', borderRadius: 7, padding: '6px 0',
          background: theme.paper, color: theme.secondary, fontSize: 15, fontWeight: 800,
        }}>STUDIO SHOP</span>
        <Icon name="web" size={22}/>
      </div>
      <div style={{height: 76, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 13}}>
        <Mark size={45}/><strong style={{fontSize: 25, letterSpacing: '-.04em'}}>Store assistant</strong>
        <span style={{marginLeft: 'auto', color: theme.secondary, fontSize: 16, fontWeight: 800}}>WEB</span>
      </div>
      <div style={{padding: '9px 25px'}}>
        <Rise time={time} at={question}><Prompt tone="#d8f0e4">A woody scent under £45?</Prompt></Rise>
        <Rise time={time} at={reply} style={{marginTop: 14}}><Reply>Try Cedar Dusk.</Reply></Rise>
        <Rise time={time} at={product} distance={46} duration={.64} style={{margin: '18px 0 0 41px'}}>
          <div style={{
            height: 208, display: 'flex', alignItems: 'stretch', overflow: 'hidden',
            borderRadius: 19, background: '#172721', color: theme.white,
          }}>
            <div style={{width: 212, overflow: 'hidden', flexShrink: 0}}>
              <ProductImage style={{width: '100%', height: '100%', transform: `scale(${1.04 + .07 * enlarge})`}}/>
            </div>
            <div style={{padding: '24px 21px', alignSelf: 'center'}}>
              <div style={{color: theme.warm, fontSize: 16, fontWeight: 800, letterSpacing: '.10em'}}>WOODY</div>
              <div style={{fontSize: 32, fontWeight: 800, marginTop: 6, letterSpacing: '-.05em'}}>Cedar Dusk</div>
              <div style={{fontSize: 25, marginTop: 6}}>£40.00</div>
            </div>
          </div>
        </Rise>
      </div>
    </div>
  </>;
}

const chats = {
  whatsapp: {
    title: 'Check what’s in stock.',
    name: 'WhatsApp', accent: theme.whatsapp, body: theme.message, bubble: theme.waBubble,
    question: 'Is Cedar Dusk in stock?', reply: 'Yes, ready to order.',
  },
  telegram: {
    title: 'Get the details.',
    name: 'Telegram', accent: theme.telegram, body: theme.tgGlass, bubble: theme.tgBubble,
    question: 'What are the scent notes?', reply: 'Here are the three main notes.',
  },
};

function StockAttachment() {
  return <div style={{
    background: '#fff', color: theme.text, borderRadius: 18, padding: 9,
    boxShadow: '0 8px 26px #1c3d3226',
  }}>
    <ProductImage style={{display: 'block', width: '100%', height: 232, borderRadius: 12, objectPosition: 'center 60%'}}/>
    <div style={{padding: '9px 8px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <span style={{fontSize: 23, fontWeight: 850}}>Cedar Dusk</span>
      <span style={{fontSize: 16, fontWeight: 850, display: 'flex', gap: 4, color: theme.whatsapp}}>
        <Icon name="check" size={18}/> In stock
      </span>
    </div>
  </div>;
}

function NotesAttachment({time}) {
  return <div style={{
    display: 'flex', height: 185, gap: 16, alignItems: 'center',
    background: '#fff', color: theme.text, borderRadius: 19, padding: 13,
    boxShadow: '0 8px 26px #31577523',
  }}>
    <ProductImage style={{width: 133, height: 157, borderRadius: 12, flexShrink: 0}}/>
    <div>
      <div style={{fontSize: 26, fontWeight: 850, marginBottom: 7}}>Cedar Dusk</div>
      {['Cedarwood', 'Sandalwood', 'Vetiver'].map((note, i) =>
        <Rise key={note} time={time} at={reveals.telegram.product + .15 + i * .14} duration={.3} distance={8}
          style={{fontSize: 18, fontWeight: 740, lineHeight: 1.5, color: theme.telegram}}>
          <span aria-hidden="true">· </span>{note}
        </Rise>)}
    </div>
  </div>;
}

export function Messenger({time, type}) {
  const data = chats[type];
  const {question, reply, product} = reveals[type];
  const telegram = type === 'telegram';
  return <>
    <ChannelHeading time={time} at={beats[type] + .04}>{data.title}</ChannelHeading>
    <div style={{
      position: 'absolute', left: telegram ? 73 : 104, top: telegram ? 364 : 328,
      width: telegram ? 574 : 512, height: telegram ? 602 : 668,
      padding: 8, background: '#102630', border: '1px solid #a6d0cb5e', borderRadius: 44,
      boxShadow: frameShadow,
    }}>
      <div style={{height: '100%', borderRadius: 36, overflow: 'hidden', position: 'relative', background: data.body}}>
        <div style={{
          display: 'flex', alignItems: 'center', height: 87, gap: 11, padding: '0 17px',
          background: data.accent, color: theme.white,
        }}>
          <Icon name="back" size={21}/><Mark size={43}/>
          <div style={{fontSize: 22, fontWeight: 800}}>Store assistant</div>
          <span style={{marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', fontSize: 16, fontWeight: 800}}>
            <Icon name={type} size={20}/>{data.name}
          </span>
        </div>
        <div style={{padding: '24px 21px'}}>
          <Rise time={time} at={question}><Prompt tone={data.bubble}>{data.question}</Prompt></Rise>
          <Rise time={time} at={reply} style={{marginTop: 22}}><Reply>{data.reply}</Reply></Rise>
          <Rise time={time} at={product} duration={.58} distance={telegram ? 31 : 56} style={{
            margin: '17px 25px 0 40px', maxWidth: 410,
          }}>{telegram ? <NotesAttachment time={time}/> : <StockAttachment/>}</Rise>
        </div>
        <div style={{
          position: 'absolute', bottom: 16, left: 18, right: 18, height: 44, borderRadius: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px',
          fontSize: 17, fontWeight: 650, color: theme.secondary, background: '#fff',
        }}>Message<span style={{color: data.accent}}><Icon name="telegram" size={20}/></span></div>
      </div>
    </div>
  </>;
}

export function Voice({time, waveform}) {
  const speech = time < beats.answer ? waveform.question : waveform.answer;
  const start = time < beats.answer ? beats.question : beats.answer;
  const index = Math.floor((time - start) * 30);
  const level = speech[index] ?? 0;
  return <>
    <ChannelHeading time={time} at={beats.voice + .04}>Ask on a call.</ChannelHeading>
    <div style={{
      position: 'absolute', left: 100, top: 344, width: 520, height: 630, borderRadius: 52,
      color: theme.white, background: 'linear-gradient(145deg,#173b45,#09192a 76%)',
      border: `1px solid ${theme.line}`, boxShadow: frameShadow, textAlign: 'center',
    }}>
      <div style={{marginTop: 38, color: theme.muted, fontSize: 17, letterSpacing: '.14em', fontWeight: 800}}>
        VOICE CALL · 00:{String(Math.max(0, Math.floor(time - beats.voice))).padStart(2, '0')}
      </div>
      <div style={{display: 'grid', placeItems: 'center', marginTop: 21}}><Mark size={94}/></div>
      <div style={{fontWeight: 850, fontSize: 34, marginTop: 14, letterSpacing: '-.045em'}}>Store assistant</div>
      <div style={{
        display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'center',
        height: 84, marginTop: 14,
      }}>{Array.from({length: 39}, (_, i) => <div key={i} style={{
        height: 5 + level * (25 + 56 * Math.sin(Math.PI * (i + 1) / 40)) * (.42 + .58 * Math.abs(Math.sin(time * 12 + i * 1.1))),
        width: 4, borderRadius: 4, background: theme.mint, opacity: .42 + .58 * Math.sin(Math.PI * (i + 1) / 40),
      }}/>)}</div>
      <Rise time={time} at={beats.question} duration={.26} style={{position: 'absolute', top: 334, insetInline: 18, fontSize: 25, fontWeight: 750}}>
        “How much is Cedar Dusk?”
      </Rise>
      <Rise time={time} at={beats.answer} duration={.26} style={{
        position: 'absolute', top: 394, insetInline: 25, fontSize: 25, fontWeight: 800, color: theme.mint,
      }}>“It’s £40, and it’s in stock.”</Rise>
      <div style={{
        position: 'absolute', left: '50%', bottom: 38, translate: '-50% 0',
        display: 'grid', placeItems: 'center', width: 62, height: 62,
        borderRadius: '50%', background: '#aa444d', color: theme.white,
      }}><span style={{transform: 'rotate(135deg)'}}><Icon name="voice" size={28}/></span></div>
    </div>
  </>;
}
