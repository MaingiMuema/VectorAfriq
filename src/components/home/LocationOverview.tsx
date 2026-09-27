import Link from 'next/link';
import { FaArrowRight, FaMapMarkerAlt } from 'react-icons/fa';
import { getPropertyTypeStats, getPopularLocations } from '@/lib/stats';
import { buildSearchResultsPath } from '@/lib/search/searchUrl';

function withSearchParams(
  pathname: string,
  params: Record<string, string | undefined>
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

const LocationOverview = async () => {
  // Fetch data directly from DB helpers
  const [typeStats, locationStats] = await Promise.all([
    getPropertyTypeStats(),
    getPopularLocations(),
  ]);

  // Process Property Types
  // Create a look-up map for easier access
  const statMap = new Map<string, number>();
  typeStats.forEach(stat => {
    // Key: "category-type" (lowercase)
    statMap.set(`${stat.category.toLowerCase()}-${stat.type.toLowerCase()}`, stat.count);
  });

  // Hero Categories:
  // apartments, bungalows, commercial-plots-houses, houses, residential-plots, townhouses

  // We map these to the content we want to show.
  // Note on "commercial-plots-houses": 
  // - The UI label is "Commercial Plots & Lands."
  // - The DB likely stores "commercial-plots" based on types check. 
  // - We will try to match "commercial-plots" from DB stats.

  const desiredTypes = [
    // Sale
    { category: 'houses', type: 'SALE', title: 'Houses for sale', defaultHref: buildSearchResultsPath({ listingType: 'sale', category: 'HOUSES' }) },
    { category: 'apartments', type: 'SALE', title: 'Apartments for sale', defaultHref: buildSearchResultsPath({ listingType: 'sale', category: 'APARTMENTS' }) },
    { category: 'townhouses', type: 'SALE', title: 'Townhouses for sale', defaultHref: buildSearchResultsPath({ listingType: 'sale', category: 'TOWNHOUSES' }) },
    { category: 'bungalows', type: 'SALE', title: 'Bungalows for sale', defaultHref: buildSearchResultsPath({ listingType: 'sale', category: 'BUNGALOWS' }) },
    { category: 'residential_plots', type: 'SALE', title: 'Residential Plots for sale', defaultHref: buildSearchResultsPath({ listingType: 'sale', category: 'RESIDENTIAL_PLOTS' }) },
    { category: 'commercial_plots', type: 'SALE', title: 'Commercial Houses & Plots for sale', defaultHref: buildSearchResultsPath({ listingType: 'sale', category: 'COMMERCIAL_PLOTS' }) },

    // Rent
    { category: 'houses', type: 'RENT', title: 'Houses for rent', defaultHref: buildSearchResultsPath({ listingType: 'rent', category: 'HOUSES' }) },
    { category: 'apartments', type: 'RENT', title: 'Apartments for rent', defaultHref: buildSearchResultsPath({ listingType: 'rent', category: 'APARTMENTS' }) },
  ];

  const displayTypes = desiredTypes.map(item => {
    // Try exact match first
    let key = `${item.category.toLowerCase()}-${item.type.toLowerCase()}`;
    let count = statMap.get(key) || 0;

    return {
      title: item.title,
      href: item.defaultHref,
      count
    };
  });
  // We keep all defined types to ensure uniformity with Hero categories, even if count is 0.

  // Popular Locations
  // Take top 5 from DB
  const popularLocations = locationStats.slice(0, 5).map(stat => ({
    name: stat.location,
    href: withSearchParams(
      buildSearchResultsPath({ listingType: 'sale' }),
      { location: stat.location }
    ),
    count: stat.count
  }));

  // Special Properties - customized logic
  // These are "featured" or "curated" searches, so we can keep them or adjust them.
  // The user prompt specifically asked to modify the list to show categories same as Hero.
  // This likely refers to the "Property Types Grid".
  const specialProperties = [
    { name: '3 bed houses in Nairobi', href: buildSearchResultsPath({ listingType: 'sale', category: 'HOUSES', locationSegments: ['nairobi'], bedrooms: '3' }) },
    { name: 'Townhouses', href: buildSearchResultsPath({ listingType: 'sale', category: 'TOWNHOUSES' }) },
    { name: 'Nairobi apartments', href: buildSearchResultsPath({ listingType: 'sale', category: 'APARTMENTS', locationSegments: ['nairobi'] }) },
    { name: 'Family friendly houses', href: withSearchParams(buildSearchResultsPath({ listingType: 'sale', category: 'HOUSES' }), { minPrice: '10000000' }) },
    { name: 'Shared apartments', href: buildSearchResultsPath({ listingType: 'rent', category: 'APARTMENTS' }) },
    { name: '1 bed Nairobi bachelor pad', href: buildSearchResultsPath({ listingType: 'sale', category: 'APARTMENTS', locationSegments: ['nairobi'], bedrooms: '1' }) },
  ];

  const totalListings = typeStats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#514f63] mb-6">
            Real Estate in Kenya
          </h2>

          <div className="prose prose-lg text-gray-600 mb-8">
            <p>
              Are you looking to live amongst the bustle of{' '}
              <Link href={buildSearchResultsPath({ listingType: 'sale', locationSegments: ['nairobi'] })} className="text-[#468AD1] hover:text-[#514f63] no-underline">
                Nairobi
              </Link>
              ? Or maybe you prefer to wake up to sea views in{' '}
              <Link href={buildSearchResultsPath({ listingType: 'sale', locationSegments: ['mombasa'] })} className="text-[#468AD1] hover:text-[#514f63] no-underline">
                Mombasa
              </Link>
              ? With over {totalListings > 0 ? totalListings.toLocaleString() : 'thousands of'} listings for sale, VectorAfriq can match you with a property to call home.
            </p>
          </div>

          {/* Popular Locations */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-[#514f63] mb-4">
              Popular Locations
            </h3>
            <div className="flex flex-wrap gap-3">
              {popularLocations.length > 0 ? (
                popularLocations.map((location) => (
                  <Link
                    key={location.name}
                    href={location.href}
                    className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-[#514f63] hover:bg-[#468AD1] hover:text-white transition-colors"
                  >
                    <FaMapMarkerAlt className="mr-2" />
                    {location.name}
                    {location.count > 0 && <span className="ml-2 text-xs opacity-75">({location.count})</span>}
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 italic">Explore our properties across Kenya</p>
              )}
            </div>
          </div>

          {/* Property Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {displayTypes.map((type) => (
              <Link
                key={type.title}
                href={type.href}
                className="group block p-4 bg-gray-50 rounded-lg hover:bg-[#468AD1] transition-colors"
              >
                <h3 className="text-lg font-medium text-[#514f63] group-hover:text-white mb-2">
                  {type.title}
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-white/80">
                  {type.count.toLocaleString()} listings
                </p>
              </Link>
            ))}
          </div>

          {/* Special Properties */}
          <div className="prose prose-lg text-gray-600 mb-8">
            <p>
              Looking for something specific? Explore our{' '}
              {specialProperties.map((prop, index) => (
                <span key={prop.name}>
                  <Link
                    href={prop.href}
                    className="text-[#468AD1] hover:text-[#514f63] no-underline"
                  >
                    {prop.name}
                  </Link>
                  {index < specialProperties.length - 1 && ', '}
                </span>
              ))}
              .
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href={buildSearchResultsPath({ listingType: 'sale' })}
              className="inline-flex items-center px-6 py-3 bg-[#468AD1] text-white rounded-lg hover:bg-[#514f63] transition-colors"
            >
              Explore all properties
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationOverview;
