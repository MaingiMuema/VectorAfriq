"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    FiHome,
    FiGrid,
    FiTool,
    FiBookOpen,
    FiShield,
    FiMap,
    FiUsers,
    FiMail,
    FiHelpCircle,
    FiFileText,
    FiTrendingUp,
    FiDollarSign,
    FiStar,
    FiLayers,
    FiMapPin,
    FiSearch,
    FiTag,
    FiCompass,
    FiBarChart2,
    FiKey,
    FiChevronsRight,
} from "react-icons/fi";
import { useNavigationLoading } from "@/contexts/NavigationLoadingContext";

/* ─────────────────── Page Data ─────────────────── */

interface SitemapLink {
    href: string;
    label: string;
    description: string;
    icon: React.ReactNode;
}

interface SitemapSection {
    title: string;
    description: string;
    accent: string;       // gradient start
    accentEnd: string;    // gradient end
    icon: React.ReactNode;
    links: SitemapLink[];
}

const sections: SitemapSection[] = [
    {
        title: "Main Pages",
        description: "Core pages of VectorAfriq Kenya",
        accent: "#6366f1",
        accentEnd: "#818cf8",
        icon: <FiHome />,
        links: [
            { href: "/", label: "Home", description: "VectorAfriq homepage – start your search", icon: <FiHome /> },
            { href: "/about-us", label: "About Us", description: "Learn about our mission & story", icon: <FiUsers /> },
            { href: "/contact-us", label: "Contact Us", description: "Get in touch with our team", icon: <FiMail /> },
            { href: "/agents", label: "Find an Agent", description: "Browse verified real estate agents", icon: <FiSearch /> },
            { href: "/partners", label: "Partners", description: "Our trusted real estate partners", icon: <FiStar /> },
        ],
    },
    {
        title: "Properties for Sale",
        description: "Browse all property categories available for purchase",
        accent: "#468AD1",
        accentEnd: "#fb7185",
        icon: <FiTag />,
        links: [
            { href: "/for-sale", label: "All Properties for Sale", description: "Explore every listing for sale", icon: <FiGrid /> },
            { href: "/apartments-for-sale", label: "Apartments for Sale", description: "Modern apartments across Kenya", icon: <FiLayers /> },
            { href: "/houses-for-sale", label: "Houses for Sale", description: "Standalone houses & bungalows", icon: <FiHome /> },
            { href: "/villas-for-sale", label: "Villas for Sale", description: "Luxury villas & estates", icon: <FiStar /> },
            { href: "/townhouses", label: "Townhouses", description: "Townhouses & maisonettes", icon: <FiGrid /> },
            { href: "/land-for-sale", label: "Land for Sale", description: "Residential & commercial plots", icon: <FiMapPin /> },
            { href: "/commercial-property-for-sale", label: "Commercial for Sale", description: "Offices, warehouses & shops", icon: <FiBarChart2 /> },
            { href: "/properties-for-sale", label: "Properties for Sale", description: "General sale listings overview", icon: <FiCompass /> },
        ],
    },
    {
        title: "Properties for Rent",
        description: "Browse all rental property categories",
        accent: "#0ea5e9",
        accentEnd: "#38bdf8",
        icon: <FiKey />,
        links: [
            { href: "/for-rent", label: "All Properties for Rent", description: "Explore every rental listing", icon: <FiGrid /> },
            { href: "/apartments-for-rent", label: "Apartments for Rent", description: "Rental apartments in all cities", icon: <FiLayers /> },
            { href: "/houses-for-rent", label: "Houses for Rent", description: "Houses available for lease", icon: <FiHome /> },
            { href: "/commercial-property-for-rent", label: "Commercial for Rent", description: "Commercial spaces for lease", icon: <FiBarChart2 /> },
            { href: "/properties-for-rent", label: "Properties for Rent", description: "General rental listings overview", icon: <FiCompass /> },
            { href: "/airbnb", label: "Airbnb / Short Stay", description: "Short-term & vacation rentals", icon: <FiMap /> },
        ],
    },
    {
        title: "Tools & Resources",
        description: "Helpful tools, guides, and market insights",
        accent: "#10b981",
        accentEnd: "#34d399",
        icon: <FiTool />,
        links: [
            { href: "/mortgage-calculator", label: "Mortgage Calculator", description: "Estimate your monthly payments", icon: <FiDollarSign /> },
            { href: "/property-valuation", label: "Property Valuation", description: "Get an instant property estimate", icon: <FiTrendingUp /> },
            { href: "/market-trends", label: "Market Trends", description: "Explore price data & analytics", icon: <FiBarChart2 /> },
            { href: "/investment-guide", label: "Investment Guide", description: "Strategic real estate investment tips", icon: <FiBookOpen /> },
            { href: "/blogs", label: "Blog & Advice", description: "Articles, guides & property news", icon: <FiFileText /> },
            { href: "/request-property", label: "Request a Property", description: "Tell us what you're looking for", icon: <FiSearch /> },
        ],
    },
    {
        title: "Legal & Support",
        description: "Company policies, FAQs, and terms of use",
        accent: "#8b5cf6",
        accentEnd: "#a78bfa",
        icon: <FiShield />,
        links: [
            { href: "/privacy-policy", label: "Privacy Policy", description: "How we handle your data", icon: <FiShield /> },
            { href: "/terms-conditions", label: "Terms & Conditions", description: "Rules governing our platform", icon: <FiFileText /> },
            { href: "/faqs", label: "FAQs", description: "Frequently asked questions", icon: <FiHelpCircle /> },
        ],
    },
];

/* ─────────────── Animation Variants ─────────────── */

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const linkVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

/* ──────────────── Component ──────────────── */

export default function SitemapPage() {
    const { setLoading } = useNavigationLoading();

    const handleLinkClick = () => {
        setLoading(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* ───── Hero Section ───── */}
            <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20">
                {/* Decorative blobs */}
                <div
                    className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
                    style={{ background: "radial-gradient(circle, #468AD1 0%, #6366f1 100%)" }}
                />
                <div
                    className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
                    style={{ background: "radial-gradient(circle, #0ea5e9 0%, #10b981 100%)" }}
                />

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center gap-2 bg-[#514f63]/5 text-[#514f63] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                            <FiMap className="text-[#468AD1]" />
                            Complete Site Directory
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#514f63] mb-4 tracking-tight">
                            Sitemap
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg text-[#514f63]/70 leading-relaxed">
                            Navigate every page on VectorAfriq Kenya at a glance.
                            Find properties, explore tools, and access resources — all organized in one place.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ───── Sections Grid ───── */}
            <motion.section
                className="max-w-6xl mx-auto px-4 sm:px-6 pb-24"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="grid gap-10 md:gap-12">
                    {sections.map((section) => (
                        <motion.div
                            key={section.title}
                            variants={sectionVariants}
                            className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden"
                        >
                            {/* Section Header */}
                            <div
                                className="px-6 py-5 sm:px-8 sm:py-6 flex items-center gap-4"
                                style={{
                                    background: `linear-gradient(135deg, ${section.accent}0D 0%, ${section.accentEnd}0D 100%)`,
                                }}
                            >
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg shadow-md shrink-0"
                                    style={{
                                        background: `linear-gradient(135deg, ${section.accent}, ${section.accentEnd})`,
                                    }}
                                >
                                    {section.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[#514f63]">
                                        {section.title}
                                    </h2>
                                    <p className="text-sm text-[#514f63]/60">{section.description}</p>
                                </div>
                                <span className="ml-auto text-xs font-semibold px-3 py-1 rounded-full"
                                    style={{
                                        color: section.accent,
                                        backgroundColor: `${section.accent}14`,
                                    }}
                                >
                                    {section.links.length} page{section.links.length > 1 ? "s" : ""}
                                </span>
                            </div>

                            {/* Links */}
                            <motion.ul
                                className="divide-y divide-slate-50 px-4 sm:px-6 pb-3"
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                            >
                                {section.links.map((link) => (
                                    <motion.li key={link.href} variants={linkVariants}>
                                        <Link
                                            href={link.href}
                                            onClick={handleLinkClick}
                                            className="group flex items-center gap-4 py-4 px-3 rounded-xl transition-all duration-200 hover:bg-slate-50/80 -mx-2"
                                        >
                                            {/* Icon */}
                                            <span
                                                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors duration-200 shrink-0"
                                                style={{
                                                    color: section.accent,
                                                    backgroundColor: `${section.accent}0F`,
                                                }}
                                            >
                                                {link.icon}
                                            </span>

                                            {/* Label + description */}
                                            <div className="flex-1 min-w-0">
                                                <span className="block text-[15px] font-semibold text-[#514f63] group-hover:text-[#468AD1] transition-colors duration-200 truncate">
                                                    {link.label}
                                                </span>
                                                <span className="block text-xs text-[#514f63]/50 truncate">
                                                    {link.description}
                                                </span>
                                            </div>

                                            {/* Arrow */}
                                            <FiChevronsRight className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#468AD1] shrink-0" />
                                        </Link>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </motion.div>
                    ))}
                </div>

                {/* ───── XML Sitemap note ───── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-14 text-center"
                >
                    <p className="text-sm text-[#514f63]/50">
                        Looking for the machine-readable sitemap?{" "}
                        <a
                            href="/sitemap.xml"
                            className="text-[#468AD1] font-medium hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View sitemap.xml →
                        </a>
                    </p>
                </motion.div>
            </motion.section>
        </div>
    );
}
