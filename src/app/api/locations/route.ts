import { NextResponse } from 'next/server';
import * as locationService from '@/lib/services/locations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (query) {
      const results = await locationService.searchLocations(query);
      return NextResponse.json(results);
    }

    const counties = await locationService.getCounties();
    return NextResponse.json(counties);
  } catch (error) {
    console.error('Error in locations GET:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
