export const mapSources = {
  low: {
    type: 'image',
    url: 'https://i.ibb.co/8DvC7kvw/Map-2774-P.avif', // 4864×2774
  },
  small: {
    type: 'image',
    url: 'https://i.ibb.co/PzQyMggc/Map-5944-P.avif', // 10424×5944
  },
  large: {
    type: 'image',
    url: 'https://i.ibb.co/yFDhWCjM/Map-8322-P.avif', // 14594×8322
  },
} as const;

export type MapSourceKey = keyof typeof mapSources;
