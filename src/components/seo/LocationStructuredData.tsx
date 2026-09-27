import SchemaMarkup, { buildWebPageSchema, buildBreadcrumbSchema } from "./SchemaMarkup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

interface LocationStructuredDataProps {
  collectionLabel: string;
  basePath: string;
  location: string;
  propertyCount: number;
  title: string;
  description: string;
  url: string;
}

export default function LocationStructuredData({
  collectionLabel,
  basePath,
  location,
  propertyCount,
  title,
  description,
  url,
}: LocationStructuredDataProps) {
  return (
    <SchemaMarkup
      id={`location-schema-${location}`}
      schema={[
        buildWebPageSchema({
          name: title,
          description: description,
          url: url,
          type: "CollectionPage",
          breadcrumbs: [
            { name: "Home", url: SITE_URL },
            { name: collectionLabel, url: `${SITE_URL}${basePath}` },
            { name: location, url: url },
          ],
        }),
        buildBreadcrumbSchema([
          { name: "Home", url: SITE_URL },
          { name: collectionLabel, url: `${SITE_URL}${basePath}` },
          { name: location, url: url },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": `${collectionLabel} in ${location}`,
          "numberOfItems": propertyCount,
          "url": url,
        },
        {
          "@context": "https://schema.org",
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${url}?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        }
      ]}
    />
  );
}
