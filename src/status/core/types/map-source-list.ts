import { mapSources, type MapSourceKey } from './map-sources';

export interface MapSourceConfig {
  key: MapSourceKey;
  name: string;
  url: string;
}

export const mapSourceList: MapSourceConfig[] = [
  {
    key: 'low',
    name: '低清地图',
    url: mapSources.low.url,
  },
  {
    key: 'small',
    name: '高清地图',
    url: mapSources.small.url,
  },
  {
    key: 'large',
    name: '超清地图',
    url: mapSources.large.url,
  },
];

export type { MapSourceKey };
