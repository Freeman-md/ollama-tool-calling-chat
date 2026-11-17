import fragranceLevels from './voice-levels.json';
import phoneLevels from './phone-voice-levels.json';
import phoneDialogue from './phone-dialogue.json';

export type InboxChannel = 'web' | 'whatsapp' | 'telegram';

type Product = {title: string; image: string; description?: string; price?: string; specs?: string[]};
type Interaction = {label: string; question: string; reply: string; product: Product};
export type Edition = {
  stage: string;
  cutout?: string;
  opening: [string, string];
  category: string;
  sources: [string, string, string];
  store: string;
  assistant: string;
  placeholder: string;
  closing: string;
  scenes: Record<InboxChannel, Interaction>;
  voice: {question: string; answer: string; confirmation: string};
  levels: {question: number[]; answer: number[]};
  mix: string;
};

const emberwood = {title: 'Emberwood', image: 'art/ember.webp'};
const iphone = {title: 'iPhone 18 Pro', image: 'art/iphone-18-pro-glacier.webp'};

const perfume: Edition = {
  stage: 'art/counter.webp',
  opening: ['The perfume', 'counter.'],
  category: 'FRAGRANCE RETAIL',
  sources: ['Catalogue', 'Stock', 'Scent notes'],
  store: 'Fragrance counter',
  assistant: 'Fragrance assistant',
  placeholder: 'Ask about a fragrance',
  closing: 'THE CONNECTED COUNTER',
  scenes: {
    web: {label: 'Find a fragrance', question: 'A woody scent under £45?', reply: 'I’d suggest Cedar Dusk. It’s £40.',
      product: {title: 'Cedar Dusk', image: 'art/cedar.webp', description: 'Woody · Cedar and vetiver', price: '£40'}},
    whatsapp: {label: 'Check stock', question: 'Do you have Emberwood?', reply: 'Yes, Emberwood is in stock.', product: emberwood},
    telegram: {label: 'Explore the notes', question: 'What are Emberwood’s notes?', reply: 'Rich oud, earthy patchouli and warm amber.',
      product: {...emberwood, specs: ['Oud', 'Patchouli', 'Amber']}},
  },
  voice: {question: 'Can I collect today?', answer: 'Yes, we’re open until six.', confirmation: 'Pickup today · until 6 pm'},
  levels: fragranceLevels,
  mix: 'audio/mix.wav',
};

const phone: Edition = {
  stage: 'art/phone-stage.webp',
  cutout: iphone.image,
  opening: ['The phone', 'shop.'],
  category: 'MOBILE RETAIL',
  sources: ['Catalogue', 'Stock', 'Product specs'],
  store: 'Phone shop',
  assistant: 'Phone shop assistant',
  placeholder: 'Ask about a phone',
  closing: 'THE CONNECTED SHOP',
  scenes: {
    web: {label: 'Find the right iPhone', question: 'A compact Pro iPhone?', reply: 'iPhone 18 Pro has a 6.3″ display.',
      product: {...iphone, description: 'Glacier · 256 GB', price: '£1,199'}},
    whatsapp: {label: 'Check the finish', question: 'Is Glacier in stock?', reply: 'Yes. Glacier 256 GB is in stock.', product: {...iphone, description: 'Glacier · 256 GB'}},
    telegram: {label: 'Get the specs', question: 'Which chip is inside?', reply: 'It runs on Apple’s A20 Pro chip.',
      product: {...iphone, specs: ['A20 Pro', '5G', '256 GB']}},
  },
  voice: phoneDialogue,
  levels: phoneLevels,
  mix: 'audio/phone/mix.wav',
};

export const editions = {perfume, phone};
