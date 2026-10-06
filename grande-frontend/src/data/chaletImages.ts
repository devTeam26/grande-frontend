import img01 from '../assets/_A1A7962.jpg';
import img02 from '../assets/_A1A7988.jpg';
import img03 from '../assets/_A1A7991.jpg';
import img04 from '../assets/_A1A8001.jpg';
import img05 from '../assets/_A1A8031.jpg';
import img06 from '../assets/_A1A8041.jpg';
import img07 from '../assets/_A1A8045.jpg';
import img08 from '../assets/_A1A8046.jpg';
import img09 from '../assets/_A1A8091.jpg';
import img10 from '../assets/_A1A8102.jpg';
import img11 from '../assets/_A1A8104.jpg';
import img12 from '../assets/_A1A8112.jpg';
import img13 from '../assets/_A1A8119.jpg';
import img14 from '../assets/_A1A8124.jpg';
import img15 from '../assets/_A1A8126.jpg';
import img16 from '../assets/_A1A8167.jpg';
import img17 from '../assets/IMG_20260615_134736296_HDR_AE.jpg';
import img18 from '../assets/5A1A8022.jpg';
import img19 from '../assets/1.jpg';
import img20 from '../assets/2.jpg';
import img21 from '../assets/IMG_20260615_131431641_HDR.jpg';
import img22 from '../assets/IMG_20260615_133901366_HDR_AE.jpg';
import img23 from '../assets/IMG_20260615_134043284_HDR_AE.jpg';
import img24 from '../assets/IMG_20260615_134713430_HDR_AE.jpg';
import img25 from '../assets/IMG_20260615_134736296_HDR_AE.jpg';
import img26 from '../assets/IMG_20260615_134830697_HDR_AE.jpg';
import img27 from '../assets/IMG_20260615_134838251_HDR_AE.jpg';
import img28 from '../assets/IMG_20260615_140302440_HDR_AE.jpg';
import img29 from '../assets/IMG_20260615_140351513_HDR_AE.jpg';
import img30 from '../assets/IMG_20260615_140506680_HDR_AE.jpg';
import img31 from '../assets/IMG_20260615_141907855_HDR_AE.jpg';
import img32 from '../assets/IMG_20260615_142034414_HDR_AE.jpg';
import img33 from '../assets/IMG_20260615_142513190_HDR_AE.jpg';
import img34 from '../assets/IMG_20260615_142613388_AEee.jpg';
import img35 from '../assets/IMG_20260615_142620294_AE.jpg';
import img36 from '../assets/IMG_20260615_142701336_HDR_AE.jpg';
import img37 from '../assets/IMG_20260615_142832737_HDR_AE.jpg';
import img38 from '../assets/IMG_20260615_143435850_HDR_AE.jpg';
import img39 from '../assets/IMG_20260615_143526917_HDR_AE.jpg';
import img40 from '../assets/IMG_20260615_143756774_HDR_AE.jpg';
import img41 from '../assets/IMG_20260615_143832117_AE.jpg';
import img42 from '../assets/IMG_20260615_143906030_HDR_AE.jpg';
import img43 from '../assets/IMG_20260615_144243981_HDR_AE.jpg';
import img44 from '../assets/IMG_20260615_144605495_HDR_AE.jpg';
import img45 from '../assets/IMG_20260615_144805928_HDR_AE.jpg';
import img46 from '../assets/IMG_20260615_144819154_HDR_AE.jpg';

const ALL_IMAGES = [
  img01, img02, img03, img04, img05, img06, img07, img08,
  img09, img10, img11, img12, img13, img14, img15, img16,
  img17, img18, img19, img20, img21, img22, img23, img24,
  img25, img26, img27, img28, img29, img30, img31, img32,
  img33, img34, img35, img36, img37, img38, img39, img40,
  img41, img42, img43, img44, img45, img46,
];

function fallbackImages(nameEn: string): string[] {
  let hash = 0;
  for (let i = 0; i < nameEn.length; i++) hash = (hash * 31 + nameEn.charCodeAt(i)) & 0xffff;
  const start = hash % ALL_IMAGES.length;
  return Array.from({ length: 5 }, (_, i) => ALL_IMAGES[(start + i) % ALL_IMAGES.length]);
}

const CHALET_IMAGES: Record<string, string[]> = {
  // Standard — A series
  a1: [img01, img02, img03, img21, img22],
  a2: [img04, img01, img02, img23, img24],
  a3: [img05, img06, img07, img25, img26],
  a4: [img08, img05, img06, img27, img21],

  // Standard — D series
  d1: [img01, img07, img04, img22, img23],
  d2: [img02, img08, img03, img24, img25],
  d3: [img17, img18, img05, img26, img27],
  d4: [img04, img06, img07, img28, img21],

  // Superior — B series
  b1: [img09, img10, img11, img28, img29],
  b2: [img12, img09, img10, img30, img31],
  b3: [img13, img14, img15, img29, img30],
  b4: [img17, img18, img09, img31, img28],
  b5: [img11, img13, img10, img29, img32],
  b6: [img12, img15, img14, img30, img31],

  // Superior — C series
  c1: [img09, img10, img28, img29, img30],
  c2: [img11, img12, img31, img32, img33],
  c3: [img13, img14, img34, img35, img36],
  c4: [img15, img09, img37, img38, img39],
  c5: [img10, img12, img40, img41, img42],
  c6: [img11, img14, img43, img44, img45],

  // VIP
  'vip 1': [img19, img20, img15, img16, img44],
  vip1:    [img19, img20, img15, img16, img44],
  'vip 2': [img16, img19, img20, img45, img46],
  vip2:    [img16, img19, img20, img45, img46],
};

export function localImagesForChalet(nameEn: string): string[] {
  const key = nameEn.trim().toLowerCase();
  const get = (k: string) => CHALET_IMAGES[k];

  if (get(key)) return get(key);

  const compact = key.replace(/\s+/g, '');
  if (get(compact)) return get(compact);

  const tokens = key.split(/\s+/);

  if (tokens.length >= 2) {
    const two = tokens.slice(-2).join(' ');
    if (get(two)) return get(two);
    if (get(two.replace(/\s+/g, ''))) return get(two.replace(/\s+/g, ''));
  }

  for (const t of tokens) {
    if (get(t)) return get(t);
  }

  return fallbackImages(nameEn);
}
