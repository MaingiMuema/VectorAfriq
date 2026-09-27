import { Metadata } from "next";
import PropertyListContainer from "@/components/properties/PropertyListContainer";
import CategoryFilterButtons from "./CategoryFilterButtons";
import PropertyListActions from "./PropertyListActions";
import { processPropertyData } from "@/lib/processPropertyData";

export const metadata: Metadata = {
  title: "Properties For Sale | VectorAfriq",
  description:
    "Browse through our wide selection of properties for sale in Kenya",
};

// Utility function to format numbers
function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

// Data fetching with revalidation
async function getPropertiesForSale() {
  try {
    const response = await fetch(`/api/properties?type=SALE`, {
      next: {
        revalidate: 3600, // Revalidate every hour
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch properties: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return processPropertyData(data);
  } catch (error) {
    console.error("Error fetching properties for sale:", error);
    return processPropertyData({
      properties: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 6,
      },
      stats: {},
    });
  }
}

export default async function PropertiesForSalePage() {
  const { properties, pagination, stats, error, errorMessage } =
    await getPropertiesForSale();

  return (
    <>
      {error && (
        <div className="mb-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Loading Properties
                </h3>
                <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
                <p className="mt-2 text-sm text-red-700">
                  Please try refreshing the page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Properties For Sale in Kenya
          </h1>
          <p className="text-gray-600 mb-3">
            {pagination.itemsPerPage * (pagination.currentPage - 1) + 1} -{" "}
            {Math.min(
              pagination.itemsPerPage * pagination.currentPage,
              pagination.totalItems
            )}{" "}
            of {formatNumber(pagination.totalItems)} Listings
          </p>
          <CategoryFilterButtons categories={Object.entries(stats)} />
        </div>
        <PropertyListActions />
      </div>

      {/* Property List */}
      <PropertyListContainer properties={properties} />
    </>
  );
}
