/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { FaHome, FaMapMarkerAlt, FaDollarSign, FaBed, FaBath, FaRuler } from 'react-icons/fa';

export default function RequestPropertyPage() {
  const [formData, setFormData] = useState({
    propertyType: '',
    location: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    minArea: '',
    maxArea: '',
    amenities: [] as string[],
    additionalRequirements: '',
    name: '',
    email: '',
    phone: '',
    preferredContact: 'email',
    urgency: 'not-urgent',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    // Show success message
    alert('Your property request has been submitted successfully! Our agents will contact you soon.');
  };

  const amenitiesList = [
    'Swimming Pool',
    'Gym',
    'Security',
    'Parking',
    'Garden',
    'Balcony',
    'Elevator',
    'Furnished',
    'Pet Friendly',
    'Backup Generator',
    'CCTV',
    'High-speed Internet',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b mt-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Request Property</h1>
          <p className="mt-2 text-lg text-gray-600">
            Tell us what you&apos;re looking for and we&apos;ll help you find it
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Property Details Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Property Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type*
                  </label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                  >
                    <option value="">Select Property Type</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial Property</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Location*
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter area, neighborhood, or city"
                      className="w-full px-4 py-2.5 pl-10 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                    />
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Range (KES)*
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        name="minPrice"
                        value={formData.minPrice}
                        onChange={handleInputChange}
                        required
                        placeholder="Min Price"
                        className="w-full px-4 py-2.5 pl-10 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">Ksh</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        name="maxPrice"
                        value={formData.maxPrice}
                        onChange={handleInputChange}
                        required
                        placeholder="Max Price"
                        className="w-full px-4 py-2.5 pl-10 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">Ksh</span>
                    </div>
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <select
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                  >
                    <option value="">Any</option>
                    <option value="studio">Studio</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <select
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                  >
                    <option value="">Any</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                </div>

                {/* Area Range */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area Range (sq ft)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        name="minArea"
                        value={formData.minArea}
                        onChange={handleInputChange}
                        placeholder="Min Area"
                        className="w-full px-4 py-2.5 pl-10 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                      />
                      <FaRuler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        name="maxArea"
                        value={formData.maxArea}
                        onChange={handleInputChange}
                        placeholder="Max Area"
                        className="w-full px-4 py-2.5 pl-10 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                      />
                      <FaRuler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Desired Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenitiesList.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Requirements */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Requirements
                </label>
                <textarea
                  name="additionalRequirements"
                  value={formData.additionalRequirements}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Any specific requirements or preferences..."
                  className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name*
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address*
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email"
                    className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number*
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                  />
                </div>

                {/* Preferred Contact Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Contact Method
                  </label>
                  <select
                    name="preferredContact"
                    value={formData.preferredContact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                {/* Urgency */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    How urgent is your request?
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                  >
                    <option value="not-urgent">Not Urgent - Just Browsing</option>
                    <option value="somewhat-urgent">Somewhat Urgent - Planning to Move in 3-6 Months</option>
                    <option value="urgent">Urgent - Planning to Move in 1-3 Months</option>
                    <option value="very-urgent">Very Urgent - Need to Move Immediately</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="px-8 py-3 bg-[#468AD1] text-white font-medium rounded-lg hover:bg-[#2F6FAE] transition-colors"
              >
                Submit Property Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}