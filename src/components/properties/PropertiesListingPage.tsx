import Link from "next/link";
import PropertyBanner from "@/components/banners/PropertyBanner";
import PropertyListContainer from "@/components/properties/PropertyListContainer";
import CategoryFilterButtons from "./CategoryFilterButtons";
import Pagination from "./Pagination";
import PropertyListActions from "./PropertyListActions";
import { Property } from "@/types";

// Utility function to format numbers
function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

interface PropertiesListingPageProps {
  properties: Property[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  stats: Record<string, number>;
  title: string;
  breadcrumbPath: string;
  error?: boolean;
  errorMessage?: string | null;
  description?: string;
  onPageChange?: (page: number) => void;
  selectedCategory?: string | null;
  onCategoryClick?: (category: string) => void;
  locationId?: string;
  seoDescription?: string | null;
  seoError?: string | null;
  isGeneratingSeo?: boolean;
}

export default function PropertiesListingPage({
  properties,
  pagination,
  stats,
  title,
  breadcrumbPath,
  description,
  error,
  errorMessage,
  onPageChange,
  selectedCategory,
  onCategoryClick,
  locationId,
  seoDescription,
  seoError,
  isGeneratingSeo,
}: PropertiesListingPageProps) {
  return (
    <div className="max-w-full overflow-x-hidden">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span>/</span>
            <Link href={breadcrumbPath} className="hover:text-primary">
              {breadcrumbPath.slice(1)}
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            <p className="text-gray-600 mb-3">
              {pagination.itemsPerPage * (pagination.currentPage - 1) + 1} -{" "}
              {Math.min(
                pagination.itemsPerPage * pagination.currentPage,
                pagination.totalItems
              )}{" "}
              of {formatNumber(pagination.totalItems)} Listings
            </p>
            {description && <p className="text-gray-600 mb-2">{description}</p>}
          </div>
          <PropertyListActions />
        </div>
        <CategoryFilterButtons
          categories={Object.entries(stats)}
          selectedCategory={selectedCategory}
          onCategoryClick={onCategoryClick}
        />
      </div>

      {/* Dynamic Banner */}
      <PropertyBanner
        fallbackDescription={description || "Browse through our wide selection of properties"}
        locationId={locationId}
      />

      {/* Property List */}
      <PropertyListContainer properties={properties} />

      {/* Pagination */}
      {pagination.totalPages > 1 && onPageChange && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}

      {/* SEO Description */}
      {(seoDescription || seoError || isGeneratingSeo) && (
        <div className={`bg-white p-5 rounded-lg shadow-sm mt-8 border-l-4 ${seoError ? 'border-red-500' : 'border-primary'}`}>
          <h3 className="font-semibold text-gray-900 mb-2 text-lg">
            {seoError ? "SEO Generator Error" : "About these Properties"}
          </h3>
          {isGeneratingSeo ? (
            <div className="animate-pulse flex flex-col gap-2 pt-1">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          ) : seoError ? (
            <div className="text-red-600 bg-red-50 p-3 rounded text-sm font-mono break-all">
              {seoError}
              <p className="mt-2 text-xs text-red-500">Hint: Verify your API Key and Model configuration in .env</p>
            </div>
          ) : (
            <p className="text-gray-700 leading-relaxed text-sm">
              {seoDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
