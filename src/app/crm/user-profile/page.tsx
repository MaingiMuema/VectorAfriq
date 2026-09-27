"use client";

import { useEffect, useState } from "react";
import { FiInfo } from "react-icons/fi";
import ProfileForm from "@/components/profile/ProfileForm";
import AgentApprovalStatus from "@/components/profile/AgentApprovalStatus";
import { toast } from "react-hot-toast";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  role: string;
  specialization: string[];
  languages: string[];
  socialMedia: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export default function UserProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch("/api/crm/profile");
        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }

        const data = await response.json();

        // Transform data if needed
        setProfileData({
          ...data,
          avatar: data.avatar || "/images/placeholder.png",
          specialization: data.specialization || [],
          languages: data.languages || [],
          socialMedia: data.socialMedia || {},
        });
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
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

  if (!profileData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center text-gray-600">
          Failed to load profile data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your profile information and settings
        </p>
      </div>

      {/* Information Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiInfo className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-blue-800">
              Complete Your Profile
            </h3>
            <div className="mt-2 text-blue-700">
              <div className="space-y-2">
                <p>
                  A complete profile helps build trust with potential clients.
                  Make sure to:
                </p>
                <ul className="list-disc ml-5">
                  <li>Add a professional profile photo</li>
                  <li>Write a detailed bio</li>
                  <li>List your specializations</li>
                  <li>Include your contact information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Approval Status */}
      {profileData.role !== "AGENT" && profileData.role !== "ADMIN" && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Application</h2>
          <AgentApprovalStatus />
        </div>
      )}

      {/* Profile Form */}
      <div className="mt-8">
        <ProfileForm initialData={profileData} />
      </div>
    </div>
  );
}
