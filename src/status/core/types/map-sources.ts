export const mapSources = {
  low: {
    type: 'image',
    url: 'https://i.ibb.co/C3LqvxYM/MAP-low-4096.webp',
  },
  small: {
    type: 'image',
    url: 'https://i.ibb.co/VY5scrwY/MAP.webp',
  },
  large: {
    type: 'image',
    url: 'https://i.ibb.co/TMs8gf4p/Map-Full.webp',
  },
} as const;

export type MapSourceKey = keyof typeof mapSources;
