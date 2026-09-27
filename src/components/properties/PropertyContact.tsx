"use client";

import { FaWhatsapp, FaPhone } from "react-icons/fa";
import ContactForm from "@/components/forms/ContactForm";
import OptimizedImage from "@/components/ui/OptimizedImage";
import AgentBadge from "@/components/properties/AgentBadge";
import type { BadgeTier } from "@/types";

interface PropertyContactProps {
  propertyId: string;
  propertyTitle: string;
  userName: string;
  userPhone: string;
  companyName?: string;
  companyLogo?: string;
  companyPhone?: string;
  badgeTier?: BadgeTier;
}

export default function PropertyContact({
  propertyId,
  propertyTitle,
  userName,
  userPhone,
  companyName,
  companyLogo,
  companyPhone,
  badgeTier,
}: PropertyContactProps) {
  const handleWhatsAppClick = () => {
    const phoneNumber = companyPhone || userPhone;
    if (phoneNumber) {
      const whatsappNumber = phoneNumber.startsWith("+")
        ? phoneNumber.replace("+", "")
        : phoneNumber.startsWith("254")
          ? phoneNumber
          : `254${phoneNumber.replace(/^0+/, "")}`;
      window.open(`https://wa.me/${whatsappNumber}`, "_blank");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <div className="relative w-[50px] h-[50px]">
          <div className="relative w-9 h-9">
            {companyLogo ? (
              <OptimizedImage
                src={companyLogo}
                alt={companyName || "Company"}
                className="rounded-full object-cover w-full h-full"
                width={36}
                height={36}
              />
            ) : (
              <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-sm font-medium">
                  {(companyName || userName || "Agent").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-500 mb-1">Listed by</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-gray-900">
              {companyName || userName || "Property Agent"}
            </p>
            <AgentBadge tier={badgeTier} size="sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
          onClick={handleWhatsAppClick}
        >
          <FaWhatsapp className="w-5 h-5" />
          <span>WhatsApp</span>
        </button>

        <a
          href={`tel:${companyPhone || userPhone}`}
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          <FaPhone className="w-5 h-5" />
          <span>{companyPhone || userPhone || "Call Now"}</span>
        </a>

        <ContactForm
          propertyId={propertyId}
          propertyTitle={propertyTitle}
        />
      </div>
    </div>
  );
}