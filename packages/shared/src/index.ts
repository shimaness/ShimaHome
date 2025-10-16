export type ID = string;

export interface Health {
  status: 'ok' | 'degraded' | 'down';
  service: string;
}

export const APP_NAME = 'ShimaHome';

export type PropertyType = 'bedsitter' | 'one_bedroom' | 'two_bedroom' | 'studio' | 'other';

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  location: string;
  rent: number; // monthly amount in local currency
  reputation: number; // 1-5
}
