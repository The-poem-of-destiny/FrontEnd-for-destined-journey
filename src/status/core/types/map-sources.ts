export const mapSources = {
  low: {
    type: 'image',
    url: 'https://i.ibb.co/gF7WXfmp/Map-2774-P.avif', // 4864×2774
  },
  small: {
    type: 'image',
    url: 'https://i.ibb.co/xK5pckf7/Map-4161-P.avif', // 10424×5944
  },
  large: {
    type: 'image',
    url: 'https://i.ibb.co/wF37W2MR/Map-8322-P.avif', // 14594×8322
  },
} as const;

export type MapSourceKey = keyof typeof mapSources;
