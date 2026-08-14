export const mapSources = {
  low: {
    type: 'image',
    url: 'https://i.ibb.co/bgFMhr2B/Maplite-4096.webp', // 4096×2335
  },
  small: {
    type: 'image',
    url: 'https://i.ibb.co/CKLKQQ4B/Maplite.webp', // 8340×4756
  },
  large: {
    type: 'image',
    url: 'https://i.ibb.co/gMCpcFd8/Map-FULL.webp', // 14594×8322
  },
} as const;

export type MapSourceKey = keyof typeof mapSources;
