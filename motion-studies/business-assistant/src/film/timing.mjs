export const format = {width: 720, height: 1280, fps: 30, seconds: 29.8};

export const beats = {
  core: 3.3,
  web: 5.8,
  whatsapp: 10.18,
  telegram: 14.94,
  voice: 19.64,
  question: 20.00,
  answer: 22.30,
  network: 25.58,
};

export const reveals = {
  web: {question: 6.2, reply: 6.98, product: 7.63},
  whatsapp: {question: 10.65, reply: 11.59, product: 12.25},
  telegram: {question: 15.42, reply: 16.30, product: 17},
};

export const handoffs = [
  {at: beats.core, span: .86, axis: 'up'},
  {at: beats.web, span: .78, axis: 'right'},
  {at: beats.whatsapp, span: .76, axis: 'left'},
  {at: beats.telegram, span: .80, axis: 'up'},
  {at: beats.voice, span: .80, axis: 'right'},
  {at: beats.network, span: .88, axis: 'up'},
];
