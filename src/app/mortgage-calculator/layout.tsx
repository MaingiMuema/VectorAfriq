import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import SchemaMarkup, { buildWebPageSchema, buildBreadcrumbSchema } from "@/components/seo/SchemaMarkup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
    title: "Mortgage Calculator",
    description: "Calculate your mortgage payments in Kenya. Use our free mortgage calculator to estimate monthly payments, total interest, and loan amounts.",
    keywords: "mortgage calculator Kenya, home loan calculator, property finance Kenya",
    alternates: {
        canonical: '/mortgage-calculator',
    },
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/mortgage-calculator", baseMetadata);
}

export default function MortgageCalculatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageUrl = `${SITE_URL}/mortgage-calculator`;
    return (
        <>
            <SchemaMarkup
                id="mortgage-calculator-schema"
                schema={[
                    buildWebPageSchema({
                        name: "Free Mortgage Calculator Kenya | VectorAfriq",
                        url: pageUrl,
                        description: "Calculate your monthly mortgage repayments, total interest payable, and loan breakdown for properties in Kenya. Free tool by VectorAfriq Kenya.",
                        breadcrumbs: [
                            { name: "Home", url: SITE_URL },
                            { name: "Mortgage Calculator", url: pageUrl },
                        ],
                    }),
                    buildBreadcrumbSchema([
                        { name: "Home", url: SITE_URL },
                        { name: "Mortgage Calculator", url: pageUrl },
                    ]),
                    // FinancialProduct schema signals this is a financial tool
                    {
                        "@context": "https://schema.org",
                        "@type": "FinancialProduct",
                        name: "Mortgage Calculator",
                        url: pageUrl,
                        description: "Free online mortgage calculator to estimate monthly payments and total interest for property purchases in Kenya.",
                        provider: {
                            "@type": "Organization",
                            name: "VectorAfriq Kenya",
                            url: SITE_URL,
                        },
                        feesAndCommissionsSpecification: "Free to use",
                    },
                    // SoftwareApplication signals it's an interactive tool
                    {
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        name: "VectorAfriq Mortgage Calculator",
                        applicationCategory: "FinanceApplication",
                        operatingSystem: "Any",
                        url: pageUrl,
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "KES",
                        },
                        description: "Calculate mortgage repayments for properties in Kenya.",
                    },
                ]}
            />
            {children}
        </>
    );
}
