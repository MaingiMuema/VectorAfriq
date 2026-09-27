import { County, City, Neighborhood } from '@/types/location';

export const counties: County[] = [
  {
    id: '1',
    name: 'Mombasa',
    slug: 'mombasa',
    type: 'county',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Nairobi',
    slug: 'nairobi',
    type: 'county',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const cities: City[] = [
  {
    id: '1',
    name: 'Nyali',
    slug: 'nyali',
    type: 'city',
    countyId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Kilimani',
    slug: 'kilimani',
    type: 'city',
    countyId: '2',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const neighborhoods: Neighborhood[] = [
  {
    id: '1',
    name: 'Nyali Beach',
    slug: 'nyali-beach',
    type: 'neighborhood',
    cityId: '1',
    countyId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Nyali Links',
    slug: 'nyali-links',
    type: 'neighborhood',
    cityId: '1',
    countyId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];
