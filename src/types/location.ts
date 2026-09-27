export interface Location {
  id: string;
  name: string;
  slug: string;
  type: 'county' | 'city' | 'neighborhood';
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface County extends Location {
  type: 'county';
  cities?: City[];
}

export interface City extends Location {
  type: 'city';
  countyId: string;
  neighborhoods?: Neighborhood[];
}

export interface Neighborhood extends Location {
  type: 'neighborhood';
  cityId: string;
  countyId: string;
}
