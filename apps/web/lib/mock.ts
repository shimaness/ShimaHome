export type Property = {
  id: string;
  title: string;
  type: 'bedsitter' | 'one_bedroom' | 'two_bedroom' | 'studio' | 'other';
  location: string;
  rent: number;
  reputation: number;
};

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    title: 'Sunny Bedsitter near CBD',
    type: 'bedsitter',
    location: 'Nairobi, Kileleshwa',
    rent: 18000,
    reputation: 4.3,
  },
  {
    id: 'p2',
    title: 'Two Bedroom with Security & Parking',
    type: 'two_bedroom',
    location: 'Nairobi, Westlands',
    rent: 65000,
    reputation: 4.7,
  },
  {
    id: 'p3',
    title: 'Studio – Close to Transit',
    type: 'studio',
    location: 'Nairobi, South B',
    rent: 25000,
    reputation: 4.1,
  },
];
