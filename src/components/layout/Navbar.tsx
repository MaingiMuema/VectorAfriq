/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import NavigationLink from "@/components/common/NavigationLink";
import { FiChevronDown } from "react-icons/fi";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X, ChevronDown } from "lucide-react";
import {
  FaUser,
  FaSignOutAlt,
  FaHeart,
  FaHome,
  FaBuilding,
  FaCrown,
  FaSearch,
  FaDollarSign,
} from "react-icons/fa";
import { MdRealEstateAgent } from "react-icons/md";
import { useNavigationLoading } from "@/contexts/NavigationLoadingContext";

interface NavLink {
  href: string;
  text: string;
}

const STATIC_SERVICE_LINKS: NavLink[] = [
  { href: "/services/property-valuation", text: "Property Valuation" },
  { href: "/services/survey-mapping", text: "Survey & Mapping" },
  { href: "/services/legal-conveyancing", text: "Legal / Conveyancing" },
  { href: "/services/mortgage-assistance", text: "Mortgage Assistance" },
  { href: "/services/architectural-construction", text: "Architectural & Construction" },
  { href: "/services/movers", text: "Movers" },
  { href: "/services/property-management", text: "Property Management" },
  { href: "/services/diaspora-services", text: "Diaspora Services" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serviceLinks, setServiceLinks] = useState<NavLink[]>(STATIC_SERVICE_LINKS);
  const pathname = usePathname();
  const { data: session } = useSession();
  const profileRef = useRef<HTMLDivElement>(null);
  const { setLoading } = useNavigationLoading();

  // Fetch dynamic service page links on mount
  useEffect(() => {
    fetch('/api/service-pages/links')
      .then((res) => res.json())
      .then((data) => {
        if (data.links && data.links.length > 0) {
          setServiceLinks(data.links.map((l: { slug: string; title: string }) => ({
            href: `/services/${l.slug}`,
            text: l.title,
          })));
        }
      })
      .catch(() => {
        // Keep static fallback on error
      });
  }, []);

  const handleLinkClick = () => {
    setLoading(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const rentLinks = [
    { href: "/apartments-for-rent", text: "Apartments for Rent" },
    { href: "/houses-for-rent", text: "Houses For Rent" },
    {
      href: "/commercial-property-for-rent",
      text: "Commercial Property for Rent",
    },
  ];

  const saleLinks = [
    { href: "/apartments-for-sale", text: "Apartments for Sale" },
    { href: "/houses-for-sale", text: "Houses For Sale" },
    {
      href: "/commercial-property-for-sale",
      text: "Commercial Property for Sale",
    },
    { href: "/land-for-sale", text: "Land for Sale" },
  ];

  return (
    <nav className="bg-white shadow-sm fixed w-full z-50 top-0">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 py-2">
          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={handleLinkClick}>
            <Image
              src="/vectorafriq-logo-removebg-preview.png"
              alt="VectorAfriq"
              width={176}
              height={56}
              className="h-24 w-auto"
            />
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            {/* For Sale Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setActiveDropdown("sale")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <div className="flex items-center">
                <Link
                  href="/properties-for-sale"
                  className="flex items-center text-[#514f63] hover:text-[#468AD1] text-sm font-medium transition-colors"
                  onClick={handleLinkClick}
                >
                  For Sale
                </Link>
                <button
                  onClick={() => toggleDropdown("sale")}
                  className="p-2 -mr-2 text-[#514f63] hover:text-[#468AD1] transition-colors"
                >
                  <FiChevronDown
                    className={`transform transition-transform ${activeDropdown === "sale" ? "rotate-180" : ""
                      }`}
                  />
                </button>
              </div>
              <div
                className={`absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg py-2 border border-gray-100 transition-all duration-200 ${activeDropdown === "sale"
                  ? "opacity-100 visible translate-y-0"
                  : "opacity-0 invisible -translate-y-2"
                  }`}
              >
                {saleLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 text-sm text-[#514f63] hover:bg-gray-50 hover:text-[#468AD1] transition-colors"
                    onClick={handleLinkClick}
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            </div>

            {/* For Rent Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setActiveDropdown("rent")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <div className="flex items-center">
                <Link
                  href="/properties-for-rent"
                  className="flex items-center text-[#514f63] hover:text-[#468AD1] text-sm font-medium transition-colors"
                  onClick={handleLinkClick}
                >
                  For Rent
                </Link>
                <button
                  onClick={() => toggleDropdown("rent")}
                  className="p-2 -mr-2 text-[#514f63] hover:text-[#468AD1] transition-colors"
                >
                  <FiChevronDown
                    className={`transform transition-transform ${activeDropdown === "rent" ? "rotate-180" : ""
                      }`}
                  />
                </button>
              </div>
              <div
                className={`absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg py-2 border border-gray-100 transition-all duration-200 ${activeDropdown === "rent"
                  ? "opacity-100 visible translate-y-0"
                  : "opacity-0 invisible -translate-y-2"
                  }`}
              >
                {rentLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 text-sm text-[#514f63] hover:bg-gray-50 hover:text-[#468AD1] transition-colors"
                    onClick={handleLinkClick}
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/airbnb"
              className={`text-sm font-medium ${isActive("/airbnb")
                ? "text-[#468AD1]"
                : "text-[#514f63] hover:text-[#468AD1]"
                } transition-colors`}
              onClick={handleLinkClick}
            >
              Airbnb
            </Link>
            <Link
              href="/blogs"
              className={`text-sm font-medium ${isActive("/blogs")
                ? "text-[#468AD1]"
                : "text-[#514f63] hover:text-[#468AD1]"
                } transition-colors`}
              onClick={handleLinkClick}
            >
              Property Insights
            </Link>
            <Link
              href="/agents"
              className={`text-sm font-medium ${isActive("/agents")
                ? "text-[#468AD1]"
                : "text-[#514f63] hover:text-[#468AD1]"
                } transition-colors`}
              onClick={handleLinkClick}
            >
              Find Agent
            </Link>
            {/* Services Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setActiveDropdown("services")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <div className="flex items-center">
                <Link
                  href="/services"
                  className={`flex items-center text-sm font-medium ${isActive("/services")
                    ? "text-[#468AD1]"
                    : "text-[#514f63] hover:text-[#468AD1]"
                    } transition-colors`}
                  onClick={handleLinkClick}
                >
                  Services
                </Link>
                <button
                  onClick={() => toggleDropdown("services")}
                  className="p-2 -mr-2 text-[#514f63] hover:text-[#468AD1] transition-colors"
                >
                  <FiChevronDown
                    className={`transform transition-transform ${activeDropdown === "services" ? "rotate-180" : ""
                      }`}
                  />
                </button>
              </div>
              <div
                className={`absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg py-2 border border-gray-100 transition-all duration-200 ${activeDropdown === "services"
                  ? "opacity-100 visible translate-y-0"
                  : "opacity-0 invisible -translate-y-2"
                  }`}
              >
                {serviceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 text-sm text-[#514f63] hover:bg-gray-50 hover:text-[#468AD1] transition-colors"
                    onClick={handleLinkClick}
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons - Desktop */}
          <div className="hidden lg:flex lg:items-center lg:space-x-3">
            {session ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={toggleProfile}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-[#514f63] hover:text-[#468AD1] transition-colors rounded-md"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || ""}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#468AD1] flex items-center justify-center text-white">
                        {session.user.name?.[0]?.toUpperCase() || <FaUser />}
                      </div>
                    )}
                  </div>
                  <span>{session.user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      {session.user.role?.toLowerCase() === "admin" && (
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => { setIsProfileOpen(false); handleLinkClick(); }}
                        >
                          <FaCrown className="mr-2" />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        href="/crm/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => { setIsProfileOpen(false); handleLinkClick(); }}
                      >
                        <FaHome className="mr-2" />
                        Dashboard
                      </Link>
                      {session.user.role === "AGENT" && (
                        <>
                          <Link
                            href="/crm/listing-management"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => { setIsProfileOpen(false); handleLinkClick(); }}
                          >
                            <MdRealEstateAgent className="mr-2" />
                            Listing Management
                          </Link>
                          <Link
                            href="/crm/lead-management"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => { setIsProfileOpen(false); handleLinkClick(); }}
                          >
                            <FaUser className="mr-2" />
                            Lead Management
                          </Link>
                          <Link
                            href="/crm/company-information"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => { setIsProfileOpen(false); handleLinkClick(); }}
                          >
                            <FaBuilding className="mr-2" />
                            Company Information
                          </Link>
                          <Link
                            href="/crm/wallet-management"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => { setIsProfileOpen(false); handleLinkClick(); }}
                          >
                            <FaDollarSign className="mr-2" />
                            Wallet Management
                          </Link>
                        </>
                      )}
                      <Link
                        href="/crm/user-profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => { setIsProfileOpen(false); handleLinkClick(); }}
                      >
                        <FaUser className="mr-2" />
                        User Profile
                      </Link>
                      <Link
                        href="/crm/saved-searches"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => { setIsProfileOpen(false); handleLinkClick(); }}
                      >
                        <FaSearch className="mr-2" />
                        Saved Searches
                      </Link>

                      <Link
                        href="/crm/favorites"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => { setIsProfileOpen(false); handleLinkClick(); }}
                      >
                        <FaHeart className="mr-2" />
                        Favorites
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                      >
                        <FaSignOutAlt className="mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-[#514f63] hover:text-[#468AD1] transition-colors rounded-md border border-transparent hover:border-[#468AD1]"
                  onClick={handleLinkClick}
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#468AD1] hover:bg-[#468AD1]/90 transition-colors rounded-md"
                  onClick={handleLinkClick}
                >
                  Sign Up
                </Link>
              </>
            )}
            <Link
              href="/crm/create-listing"
              className="px-4 py-2 text-sm font-medium text-white bg-[#514f63] hover:bg-[#514f63]/90 transition-colors rounded-md"
              onClick={handleLinkClick}
            >
              Create Listing
            </Link>
            <Link
              href="/request-property"
              className="px-4 py-2 text-sm font-medium text-white bg-[#514f63] hover:bg-[#514f63]/90 transition-colors rounded-md"
              onClick={handleLinkClick}
            >
              Request Property
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-[#468AD1] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#468AD1]"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <X className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`${mobileMenuOpen ? "block" : "hidden"
          } lg:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 z-50`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/properties-for-sale"
            className="block px-3 py-2 rounded-md text-base font-medium text-[#514f63] hover:text-[#468AD1] hover:bg-gray-50"
            onClick={() => { setMobileMenuOpen(false); handleLinkClick(); }}
          >
            For Sale
          </Link>
          <Link
            href="/properties-for-rent"
            className="block px-3 py-2 rounded-md text-base font-medium text-[#514f63] hover:text-[#468AD1] hover:bg-gray-50"
            onClick={() => { setMobileMenuOpen(false); handleLinkClick(); }}
          >
            For Rent
          </Link>
          <Link
            href="/airbnb"
            className="block px-3 py-2 rounded-md text-base font-medium text-[#514f63] hover:text-[#468AD1] hover:bg-gray-50"
            onClick={() => { setMobileMenuOpen(false); handleLinkClick(); }}
          >
            Airbnb
          </Link>
          <Link
            href="/agents"
            className="block px-3 py-2 rounded-md text-base font-medium text-[#514f63] hover:text-[#468AD1] hover:bg-gray-50"
            onClick={() => { setMobileMenuOpen(false); handleLinkClick(); }}
          >
            Find Agent
          </Link>
          <Link
            href="/services"
            className="block px-3 py-2 rounded-md text-base font-medium text-[#514f63] hover:text-[#468AD1] hover:bg-gray-50"
            onClick={() => { setMobileMenuOpen(false); handleLinkClick(); }}
          >
            Services
          </Link>
          <Link
            href="/blogs"
            className="block px-3 py-2 rounded-md text-base font-medium text-[#514f63] hover:text-[#468AD1] hover:bg-gray-50"
            onClick={() => { setMobileMenuOpen(false); handleLinkClick(); }}
          >
            Property Insights
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="px-2 space-y-1">
            {!session ? (
              <>
                <Link
                  href="/auth/signin"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#514f63] hover:text-[#468AD1] hover:bg-gray-50"
                  onClick={() => { setMobileMenuOpen(false); handleLinkClick(); }}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#514f63] hover:text-[#468AD1] hover:bg-gray-50"
                  onClick={() => { setMobileMenuOpen(false); handleLinkClick(); }}
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/crm/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#514f63] hover:text-[#468AD1] hover:bg-gray-50"
                  onClick={() => { setMobileMenuOpen(false); handleLinkClick(); }}
                >
                  Dashboard
                </Link>
                <Link
                  href="/crm/create-listing"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#514f63] hover:text-[#468AD1] hover:bg-gray-50"
                  onClick={() => { setMobileMenuOpen(false); handleLinkClick(); }}
                >
                  Create Listing
                </Link>
                <Link
                  href="/request-property"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#514f63] hover:text-[#468AD1] hover:bg-gray-50"
                  onClick={() => { setMobileMenuOpen(false); handleLinkClick(); }}
                >
                  Request Property
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-[#514f63] hover:text-[#468AD1] hover:bg-gray-50"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
