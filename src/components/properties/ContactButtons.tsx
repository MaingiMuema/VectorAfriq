"use client";

import { FaPhoneAlt, FaWhatsapp, FaEnvelope } from "react-icons/fa";

interface ContactButtonsProps {
  className?: string;
  phone?: string;
  whatsapp?: string;
  messageHref?: string;
}

function normalizePhone(phone?: string): string | null {
  if (!phone) {
    return null;
  }

  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned || null;
}

export default function ContactButtons({
  className,
  phone,
  whatsapp,
  messageHref,
}: ContactButtonsProps) {
  const normalizedPhone = normalizePhone(phone);
  const normalizedWhatsapp = normalizePhone(whatsapp) || normalizedPhone;
  const whatsappNumber = normalizedWhatsapp?.replace(/^\+/, "");

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      {messageHref ? (
        <a
          href={messageHref}
          className="inline-flex p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Send message"
        >
          <FaEnvelope className="w-4 h-4 text-gray-500" />
        </a>
      ) : (
        <span className="inline-flex p-2 bg-gray-50 rounded-lg" aria-hidden="true">
          <FaEnvelope className="w-4 h-4 text-gray-300" />
        </span>
      )}
      {normalizedPhone || whatsappNumber ? (
        <>
          {normalizedPhone ? (
            <a
              href={`tel:${normalizedPhone}`}
              className="inline-flex p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Call agent"
            >
              <FaPhoneAlt className="w-4 h-4 text-gray-500" />
            </a>
          ) : (
            <span className="inline-flex p-2 bg-gray-50 rounded-lg" aria-hidden="true">
              <FaPhoneAlt className="w-4 h-4 text-gray-300" />
            </span>
          )}
          {whatsappNumber ? (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Contact agent on WhatsApp"
            >
              <FaWhatsapp className="w-4 h-4 text-gray-500" />
            </a>
          ) : (
            <span className="inline-flex p-2 bg-gray-50 rounded-lg" aria-hidden="true">
              <FaWhatsapp className="w-4 h-4 text-gray-300" />
            </span>
          )}
        </>
      ) : (
        <>
          <span className="inline-flex p-2 bg-gray-50 rounded-lg" aria-hidden="true">
            <FaPhoneAlt className="w-4 h-4 text-gray-300" />
          </span>
          <span className="inline-flex p-2 bg-gray-50 rounded-lg" aria-hidden="true">
            <FaWhatsapp className="w-4 h-4 text-gray-300" />
          </span>
        </>
      )}
    </div>
  );
}
