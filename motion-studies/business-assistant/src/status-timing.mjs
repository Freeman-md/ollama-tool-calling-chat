export const statusDuration = 29;

export const moments = {
  gather: 1.35,
  core: 2.95,
  web: 4.45,
  recommendation: 6.22,
  whatsapp: 9.7,
  stock: 11.30,
  telegram: 14.68,
  notes: 16.15,
  voice: 19.47,
  question: 19.67,
  answer: 21.32,
  close: 25.45,
};

export const channelMoves = [
  {from: 3.12, to: moments.web},
  {from: 8.35, to: moments.whatsapp},
  {from: 13.28, to: moments.telegram},
  {from: 18.14, to: moments.voice},
  {from: 24.52, to: moments.close},
];
