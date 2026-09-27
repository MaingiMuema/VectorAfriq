"use client";

import { useEffect, useState } from "react";
import { FiInfo } from "react-icons/fi";
import CompanyForm from "@/components/company/CompanyForm";
import { toast } from "react-hot-toast";

interface CompanyData {
  id: string;
  name: string;
  logo: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export default function CompanyInformationPage() {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await fetch("/api/crm/company");

        if (!response.ok) {
          throw new Error("Failed to fetch company data");
        }

        const data = await response.json();

        // Use logo path as-is since it's already in the correct format from the server
        const processedLogo = data.logo || "/images/placeholder.png";

        // Transform data and set defaults
        setCompanyData({
          id: data.id || "",
          name: data.name || "",
          logo: processedLogo,
          description: data.description || "",
          email: data.email || "",
          phone: data.phone || "",
          website: data.website || "",
          address: data.address || "",
          socialMedia: data.socialMedia || {},
        });
      } catch (error) {
        console.error("Error fetching company data:", error);
        toast.error("Failed to load company data");

        // Set default data if fetch fails
        setCompanyData({
          id: "",
          name: "",
          logo: "/images/placeholder.png",
          description: "",
          email: "",
          phone: "",
          website: "",
          address: "",
          socialMedia: {},
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 border-2 border-[#468AD1] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center text-gray-600">
          Failed to load company data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Company Information
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your company profile and contact information
        </p>
      </div>

      {/* Information Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiInfo className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Why is this important?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Your company information is displayed on your property listings
                and agent profile. Complete and accurate information helps build
                trust with potential clients and improves your visibility on
                VectorAfriq.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Form */}
      <CompanyForm initialData={companyData} />
    </div>
  );
}
