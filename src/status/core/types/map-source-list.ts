export type MapSourceKey = 'small' | 'large';

export interface MapSourceConfig {
  key: MapSourceKey;
  name: string;
  url: string;
}

export const mapSourceList: MapSourceConfig[] = [
  {
    key: 'small',
    name: '高清地图',
    url: 'https://i.ibb.co/VY5scrwY/MAP.webp',
  },
  {
    key: 'large',
    name: '超清地图',
    url: 'https://i.ibb.co/TMs8gf4p/Map-Full.webp',
  },
];
