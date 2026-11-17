import type { ReactNode, CSSProperties } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import clock from "./score.json";
import levels from "./levels.json";
import "./style.css";

const smooth = Easing.bezier(0.62, 0, 0.16, 1);
const out = Easing.bezier(0.18, 0.8, 0.24, 1);
const ramp = (f: number, a: number, b: number, easing = out) =>
  interpolate(f, [a, b], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
type Pose = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  s: number;
};
const poses: Pose[] = [
  { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 },
  { x: 1040, y: -150, z: -240, rx: 0, ry: -27, rz: 0, s: 1 },
  { x: 1990, y: 180, z: -370, rx: 4, ry: 19, rz: 0, s: 1 },
  { x: 3020, y: -70, z: -500, rx: -3, ry: -15, rz: -9, s: 1 },
  { x: 4010, y: 200, z: -260, rx: 0, ry: 26, rz: 3, s: 1 },
  { x: 5010, y: -30, z: 0, rx: 0, ry: 0, rz: 0, s: 1 },
];
function camera(f: number) {
  const pose = { ...poses[0] };
  let hop = 0;
  clock.flights.forEach(([a, b], i) => {
    const u = ramp(f, a, b, smooth);
    for (const k of Object.keys(pose) as (keyof Pose)[])
      pose[k] = lerp(pose[k], poses[i + 1][k], u);
    if (f >= a && f <= b) hop = 0.24 * Math.sin(Math.PI * u);
  });
  pose.s *= 1 + hop;
  return pose;
}
const place = (p: Pose) =>
  `translate3d(${p.x}px,${p.y}px,${p.z}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg) scale(${p.s})`;
const inverse = (p: Pose) =>
  `scale(${1 / p.s}) rotateZ(${-p.rz}deg) rotateY(${-p.ry}deg) rotateX(${-p.rx}deg) translate3d(${-p.x}px,${-p.y}px,${-p.z}px)`;
function Mark({ small = false }: { small?: boolean }) {
  return (
    <div className={small ? "mark small" : "mark"}>
      <svg
        width="38"
        height="38"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M11 28V12h17M11 20h13M20 12v16"
          stroke="#92ffdd"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <circle cx="29" cy="28" r="3" fill="#92ffdd" />
      </svg>
    </div>
  );
}
type Channel = "web" | "whatsapp" | "telegram" | "voice";
function Icon({ type }: { type: Channel | "mic" | "speaker" }) {
  const d = {
    web: "M3 5h18v14H3z M3 10h18 M6 7.5h1 M10 7.5h1",
    whatsapp:
      "M21 11.5A9 9 0 0 1 7.5 19L3 21l1.4-4.4A9 9 0 1 1 21 11.5 M8 8c-1 3 5 8 7 6l-2-2-1 1-3-3 1-1z",
    telegram: "M3 10l18-6-4 16-6-5-3 2 1-5 8-5-9 6z",
    voice: "M7 3l3 5-2 2c1 3 3 5 6 6l2-2 5 3c-1 5-6 4-11 0S1 6 7 3z",
    mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0z M6 11v1a6 6 0 0 0 12 0v-1 M12 18v4 M9 22h6",
    speaker: "M3 9h4l5-4v14l-5-4H3z M16 9a4 4 0 0 1 0 6 M19 6a8 8 0 0 1 0 12",
  };
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <path d={d[type]} />
    </svg>
  );
}
function Rise({
  f,
  at,
  children,
  style,
}: {
  f: number;
  at: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const p = ramp(f, at, at + 15);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${18 * (1 - p)}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
const interactions = {
  web: {
    name: "Web",
    question: "A Pro iPhone under £1,250?",
    reply: "iPhone 18 Pro fits your budget.",
    heading: "Your next iPhone.",
  },
  whatsapp: {
    name: "WhatsApp",
    question: "Is Glacier available?",
    reply: "Yes. Glacier 256 GB is in stock.",
    heading: "The finish you want.",
  },
  telegram: {
    name: "Telegram",
    question: "What chip does it use?",
    reply: "It has Apple’s A20 Pro chip.",
    heading: "The details, answered.",
  },
};
function Result({
  channel,
  f,
  at,
}: {
  channel: keyof typeof interactions;
  f: number;
  at: number;
}) {
  const image = ramp(f, at, at + 15);
  return (
    <div className="result">
      <Img
        src={staticFile("art/product.webp")}
        style={{ opacity: image, transform: `scale(${1.08 - 0.08 * image})` }}
      />
      <div className="fields">
        <Rise f={f} at={at + 10}>
          <h3>iPhone 18 Pro</h3>
        </Rise>
        <Rise f={f} at={at + 20}>
          {channel === "web" ? (
            <p>Glacier · 256 GB</p>
          ) : channel === "whatsapp" ? (
            <p className="stock">● In stock</p>
          ) : (
            <p>
              6.3″ OLED display
              <br />
              256 GB · 5G
            </p>
          )}
        </Rise>
        <Rise f={f} at={at + 30}>
          <b>
            {channel === "web"
              ? "£1,199"
              : channel === "whatsapp"
                ? "Glacier · 256 GB"
                : "A20 Pro"}
          </b>
        </Rise>
      </div>
    </div>
  );
}
function Inbox({
  channel,
  f,
}: {
  channel: keyof typeof interactions;
  f: number;
}) {
  const data = interactions[channel],
    t = clock[channel];
  const typing = f >= t.type && f < t.send;
  const typed = data.question.slice(
    0,
    Math.round(data.question.length * ramp(f, t.type, t.send, Easing.linear)),
  );
  return (
    <div className={`pane ${channel}`}>
      <div className="section-name">
        <Icon type={channel} />
        {data.name}
      </div>
      <h2>{data.heading}</h2>
      <div className="app">
        {channel === "web" && (
          <div className="chrome">
            <i />
            <i />
            <i />
            <span>Phone shop</span>
          </div>
        )}
        <div className="app-head">
          <Mark small />
          <div>
            <strong>Shop assistant</strong>
            <span>
              {channel === "web" ? "Mobile specialist" : "Business account"}
            </span>
          </div>
          <Icon type={channel} />
        </div>
        <div className="conversation">
          <Rise f={f} at={t.send}>
            <div className="question">{data.question}</div>
          </Rise>
          <Rise f={f} at={t.reply}>
            <div className="reply">
              <Mark small />
              <span>{data.reply}</span>
            </div>
          </Rise>
          <Rise f={f} at={t.result}>
            <Result channel={channel} f={f} at={t.result} />
          </Rise>
        </div>
        <div className="composer">
          <span>{typing ? typed : "Ask the shop…"}</span>
          <span className="send">↗</span>
        </div>
      </div>
      <div className="under">
        <Mark small />
        Same assistant. Same catalogue.
      </div>
    </div>
  );
}
function Call({ f }: { f: number }) {
  const t = clock.voice;
  const env =
    f < t.answer
      ? (levels.question[f - t.question] ?? 0)
      : (levels.answer[f - t.answer] ?? 0);
  return (
    <div className="pane voice">
      <div className="section-name">
        <Icon type="voice" />
        Voice
      </div>
      <h2>A conversation away.</h2>
      <div className="call">
        <div className="call-status">
          CONNECTED · 00:
          {String(Math.max(0, Math.floor((f - 632) / 30))).padStart(2, "0")}
        </div>
        <Mark />
        <h3>Shop assistant</h3>
        <div className="wave">
          {Array.from({ length: 35 }, (_, i) => (
            <i
              key={i}
              style={{
                height:
                  5 +
                  48 *
                    env *
                    (0.3 + 0.7 * Math.abs(Math.sin(f * 0.6 + i * 1.2))) *
                    Math.sin((Math.PI * (i + 1)) / 36),
              }}
            />
          ))}
        </div>
        <Rise f={f} at={t.question}>
          <p>“Can I collect it today?”</p>
        </Rise>
        <Rise f={f} at={t.answer}>
          <p className="answer">“Yes. We close at six.”</p>
        </Rise>
        <Rise f={f} at={t.confirm}>
          <div className="hours">Collection today · until 6 pm</div>
        </Rise>
        <div className="call-buttons">
          <span>
            <Icon type="mic" />
          </span>
          <span>
            <Icon type="speaker" />
          </span>
          <b>
            <Icon type="voice" />
          </b>
        </div>
      </div>
    </div>
  );
}
function CampaignArt() {
  return (
    <div className="campaign-art">
      <Img className="studio-image" src={staticFile("art/studio.webp")} />
      <div className="device-shadow" />
      <Img
        className="device"
        src={staticFile("art/product.webp")}
        alt="Glacier iPhone 18 Pro"
      />
    </div>
  );
}
function Hero({ f }: { f: number }) {
  return (
    <div className="hero">
      <CampaignArt />
      <div className="hero-shade" />
      <div className="hero-copy">
        <span>YOUR PHONE BUSINESS</span>
        <h1>
          Great phones.
          <br />
          <em>Better service.</em>
        </h1>
      </div>
      <Rise
        f={f}
        at={26}
        style={{ position: "absolute", bottom: 60, left: 42, right: 42 }}
      >
        <div className="hero-footer">
          <Mark />
          <div>
            <b>One intelligent assistant.</b>
            <p>Products. Answers. Actions.</p>
          </div>
        </div>
      </Rise>
    </div>
  );
}
function End({ f }: { f: number }) {
  return (
    <div className="end">
      <div className="end-images">
        <CampaignArt />
      </div>
      <div className="end-shade" />
      <div className="end-copy">
        <Rise f={f} at={846}>
          <h1>
            One assistant.
            <br />
            Your business.
            <br />
            <em>Every channel.</em>
          </h1>
        </Rise>
      </div>
      <Rise f={f} at={870}>
        <div className="end-mark">
          <Mark />
        </div>
      </Rise>
      <div className="channels">
        {(["web", "whatsapp", "telegram", "voice"] as Channel[]).map(
          (type, i) => (
            <Rise f={f} at={884 + i * 6} key={type}>
              <div>
                <Icon type={type} />
                <span>
                  {type === "whatsapp"
                    ? "WhatsApp"
                    : type === "telegram"
                      ? "Telegram"
                      : type === "web"
                        ? "Web"
                        : "Voice"}
                </span>
              </div>
            </Rise>
          ),
        )}
      </div>
    </div>
  );
}
export function PhoneOrbit() {
  const f = useCurrentFrame();
  const c = camera(f);
  const posesContent = [
    <Hero f={f} />,
    <Inbox channel="web" f={f} />,
    <Inbox channel="whatsapp" f={f} />,
    <Inbox channel="telegram" f={f} />,
    <Call f={f} />,
    <End f={f} />,
  ];
  return (
    <AbsoluteFill className="film">
      <div className="stage">
        <div className="camera" style={{ transform: inverse(c) }}>
          {poses.map((p, i) => (
            <div key={i} className="station" style={{ transform: place(p) }}>
              {posesContent[i]}
            </div>
          ))}
          {Array.from({ length: 24 }, (_, i) => (
            <div
              className="particle"
              key={i}
              style={{
                transform: `translate3d(${((i * 727) % 6200) - 350}px,${((i * 463) % 2000) - 1000}px,${-900 - ((i * 149) % 1300)}px)`,
              }}
            />
          ))}
        </div>
      </div>
      <Img className="brand" src={staticFile("art/brand.svg")} />
      <Audio src={staticFile("audio/mix.wav")} />
    </AbsoluteFill>
  );
}
