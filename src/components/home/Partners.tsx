import Image from "next/image";
import Link from "next/link";

interface Partner {
  id: string;
  name: string;
  logo: string;
  link: string;
}

interface PartnersProps {
  partners: Partner[];
}

function normalizePartnerLink(link: string): string {
  if (!link) return "#";
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `https://${link}`;
}

export default function Partners({ partners }: PartnersProps) {
  if (partners.length === 0) {
    return null;
  }

  // Duplicate partners for seamless infinite loop
  const duplicatedPartners = [...partners, ...partners, ...partners];

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#514f63] mb-2">
              Real Estate Partners
            </h2>
            <p className="text-gray-600">
              Trusted by Kenya's leading real estate companies
            </p>
          </div>
          <Link
            href="/partners"
            className="text-[#468AD1] hover:text-[#468AD1]/80 transition-colors text-sm font-medium"
          >
            View all partners
          </Link>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full group/carousel">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div className="partners-track flex gap-6 py-4">
          {duplicatedPartners.map((partner, index) => (
            <Link
              key={`${partner.id}-${index}`}
              href={normalizePartnerLink(partner.link)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-48 h-32 relative bg-white rounded-lg border border-gray-100 hover:border-[#468AD1] transition-colors p-4 flex items-center justify-center group shadow-sm"
            >
              <div className="relative w-full h-full">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  sizes="200px"
                  className="object-contain filter group-hover:brightness-110 transition-all"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
