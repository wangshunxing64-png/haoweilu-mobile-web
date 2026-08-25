import { DishItem, ReviewOption } from '../types';

export const DISHES_LIST: DishItem[] = [
  { id: 'soup', name: '骨汤烫菜', desc: '鲜香暖胃' },
  { id: 'pork', name: '酸菜蹄膀', desc: '软糯开胃' },
  { id: 'spicy-chicken', name: '辣子鸡火锅', desc: '香辣过瘾' },
  { id: 'bean-hotpot', name: '豆米火锅', desc: '浓郁绵密' },
  { id: 'malatang', name: '麻辣烫', desc: '贵阳风味' },
  { id: 'intestine-chicken', name: '肥肠鸡火锅', desc: '软糯鲜香' },
];

export const EXPERIENCE_TAGS: string[] = [
  '味道不错',
  '汤底鲜香',
  '很下饭',
  '服务热情',
  '上菜快',
  '环境舒服',
  '分量足',
  '性价比高',
];

export const INITIAL_REVIEWS: ReviewOption[] = [
  {
    id: 'natural',
    type: '✦ 自然口语',
    tag: '自然真实',
    content: '来李记好味道吃了份麻辣烫，味道不错，分量也足。',
  },
  {
    id: 'detail',
    type: '✦ 细节体验',
    tag: '菜品细节',
    content: '他家的麻辣烫，吃起来很过瘾，就是那种老味道，汤底的味道也挺正的。',
  },
  {
    id: 'concise',
    type: '✦ 简洁推荐',
    tag: '简洁自然',
    content: '麻辣烫好吃，下次还会再来。',
  },
];

export const ALTERNATIVE_REVIEWS: ReviewOption[][] = [
  [
    {
      id: 'alt-1',
      type: '✦ 自然口语',
      tag: '自然真实',
      content: '今天尝了店里的特色麻辣烫，汤底鲜香浓郁，食材很新鲜，吃得很满足！',
    },
    {
      id: 'alt-2',
      type: '✦ 细节体验',
      tag: '菜品细节',
      content: '麻辣烫的香气特别纯正，红油辣而不燥，配菜煮得恰到好处，口感层层丰富。',
    },
    {
      id: 'alt-3',
      type: '✦ 简洁推荐',
      tag: '简洁自然',
      content: '味道正宗，性价比很高，强烈推荐！',
    },
  ],
  [
    {
      id: 'alt-4',
      type: '✦ 自然口语',
      tag: '自然真实',
      content: '朋友推荐来的，麻辣烫果然名不虚传，服务态度也很好，吃得开心。',
    },
    {
      id: 'alt-5',
      type: '✦ 细节体验',
      tag: '菜品细节',
      content: '分量特别实在，骨汤打底非常醇厚，贵阳风味地道，下次带家人一起来。',
    },
    {
      id: 'alt-6',
      type: '✦ 简洁推荐',
      tag: '简洁自然',
      content: '地道老味道，份量十足，五星好评！',
    },
  ],
];

