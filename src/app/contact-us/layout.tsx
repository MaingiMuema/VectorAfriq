import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import SchemaMarkup, { buildWebPageSchema, buildBreadcrumbSchema } from "@/components/seo/SchemaMarkup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
    title: "Contact Us",
    description: "Get in touch with VectorAfriq Kenya. Contact our team for property inquiries, support, or business opportunities.",
    keywords: "contact VectorAfriq, Kenya real estate contact, property support Kenya",
    alternates: {
        canonical: '/contact-us',
    },
    openGraph: {
        title: "Contact VectorAfriq Kenya",
        description: "Get in touch with our team for any inquiries or support regarding properties in Kenya.",
        type: 'website',
    },
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/contact-us", baseMetadata);
}

export default function ContactUsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageUrl = `${SITE_URL}/contact-us`;
    return (
        <>
            <SchemaMarkup
                id="contact-us-schema"
                schema={[
                    buildWebPageSchema({
                        name: "Contact VectorAfriq Kenya",
                        url: pageUrl,
                        description: "Get in touch with the VectorAfriq Kenya team for property inquiries, agent support, or business opportunities.",
                        type: "ContactPage",
                        breadcrumbs: [
                            { name: "Home", url: SITE_URL },
                            { name: "Contact Us", url: pageUrl },
                        ],
                    }),
                    buildBreadcrumbSchema([
                        { name: "Home", url: SITE_URL },
                        { name: "Contact Us", url: pageUrl },
                    ]),
                    // ContactPage also benefits from a LocalBusiness contact schema
                    {
                        "@context": "https://schema.org",
                        "@type": "LocalBusiness",
                        name: "VectorAfriq Kenya",
                        url: SITE_URL,
                        address: {
                            "@type": "PostalAddress",
                            addressLocality: "Nairobi",
                            addressCountry: "KE",
                        },
                        areaServed: "Kenya",
                        description: "Kenya's leading online property marketplace.",
                    },
                ]}
            />
            {children}
        </>
    );
}
