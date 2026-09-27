'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  FiCheckCircle,
  FiClock,
  FiArrowLeft,
  FiMessageSquare,
  FiMapPin,
} from 'react-icons/fi';

/* ──────────── Types ──────────── */

interface LocationSuggestion {
  id: string;
  type: string;
  display: string;
}

/* ──────────── Constants ──────────── */

const serviceTypes = [
  { value: 'title-verification', label: 'Title Verification' },
  { value: 'property-surveying', label: 'Property Surveying' },
  { value: 'boundary-survey', label: 'Boundary Survey' },
  { value: 'legal-consultation', label: 'Legal Consultation' },
  { value: 'conveyancing', label: 'Conveyancing' },
  { value: 'documentation', label: 'Documentation Services' },
  { value: 'property-valuation', label: 'Property Valuation' },
  { value: 'land-search', label: 'Land Search (ArdhiSasa)' },
  { value: 'ownership-transfer', label: 'Ownership Transfer' },
  { value: 'land-dispute', label: 'Land Dispute Resolution' },
];

const initialForm = {
  name: '',
  email: '',
  phone: '',
  serviceType: '',
  location: '',
  propertyUrl: '',
  message: '',
};

/* ──────────── Main Component ──────────── */

export default function SurveyorInquiryPage() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiries, setInquiries] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    serviceType: string;
    location: string | null;
    message: string;
    status: string;
    createdAt: string;
  }>>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const response = await fetch('/api/crm/surveyor-inquiries');
        if (response.ok) {
          const data = await response.json();
          setInquiries(data.inquiries || []);
        }
      } catch (error) {
        console.error('Could not load inquiries', error);
      } finally {
        setLoadingInquiries(false);
      }
    };
    fetchInquiries();
  }, []);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitInquiry = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/surveyors/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Submission failed');

      setSubmitted(true);
      toast.success('Inquiry submitted! VectorAfriq will review and match you with a verified professional.');

      // Refresh inquiries list
      const inquiriesResponse = await fetch('/api/crm/surveyor-inquiries');
      if (inquiriesResponse.ok) {
        const inquiriesData = await inquiriesResponse.json();
        setInquiries(inquiriesData.inquiries || []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pt-24">
        <div className="rounded-lg border border-gray-100 bg-white p-10 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inquiry Submitted!</h1>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            VectorAfriq will review your request, provide a quote, and match you with a verified professional. You&apos;ll hear from us within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetForm}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#468AD1] text-sm font-semibold text-white hover:bg-[#2F6FAE]"
            >
              Submit Another Inquiry
            </button>
            <Link
              href="/surveyors-legal"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Due Diligence Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/surveyors-legal"
            className="inline-flex items-center text-sm text-gray-500 hover:text-[#468AD1] transition-colors"
          >
            <FiArrowLeft className="mr-1 h-4 w-4" />
            Back to Due Diligence Services
          </Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Request Due Diligence Services
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Submit an inquiry and VectorAfriq will match you with the right verified professional for your property needs.
            </p>
          </div>
        </div>
      </div>

      {/* Inquiry Form */}
      <form
        onSubmit={submitInquiry}
        className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm space-y-6"
      >
        {/* Contact Details */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            Your Details
          </h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(value) => updateField('name', value)}
              required
              placeholder="John Doe"
            />
            <Input
              label="Email Address"
              value={form.email}
              onChange={(value) => updateField('email', value)}
              type="email"
              required
              placeholder="john@example.com"
            />
            <Input
              label="Phone Number"
              value={form.phone}
              onChange={(value) => updateField('phone', value)}
              placeholder="+254 7XX XXX XXX"
            />
          </div>
        </section>

        {/* Service Details */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            Service Details
          </h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Service Type *</span>
              <select
                required
                value={form.serviceType}
                onChange={(event) => updateField('serviceType', event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
              >
                <option value="">Select a service</option>
                {serviceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <LocationInput
              label="Property Location"
              value={form.location}
              onChange={(value) => updateField('location', value)}
              placeholder="e.g., Kilimani, Nairobi"
              required
            />
          </div>
          <div className="mt-4">
            <Input
              label="Property URL (Optional)"
              value={form.propertyUrl}
              onChange={(value) => updateField('propertyUrl', value)}
              placeholder="https://vectorafriqproperties.co.ke/property/..."
            />
          </div>
        </section>

        {/* Message */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            Describe Your Needs
          </h2>
          <div className="mt-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Tell us about the property and what services you need *
              </span>
              <textarea
                rows={4}
                required
                value={form.message}
                onChange={(event) => updateField('message', event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                placeholder="Describe your property, the services you need, and any relevant details..."
              />
            </label>
          </div>
        </section>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-100">
          <Link
            href="/surveyors-legal"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-[#468AD1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2F6FAE] disabled:opacity-60"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                Submit Inquiry
                <FiMessageSquare className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Previous Inquiries */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Your Recent Inquiries
        </h2>
        {loadingInquiries ? (
          <p className="text-sm text-gray-500">Loading inquiries...</p>
        ) : inquiries.length === 0 ? (
          <p className="text-sm text-gray-500">No inquiries yet. Submit one above to get started.</p>
        ) : (
          <div className="space-y-3">
            {inquiries.slice(0, 5).map((inquiry) => (
              <div
                key={inquiry.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {serviceTypes.find((s) => s.value === inquiry.serviceType)?.label || inquiry.serviceType}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        inquiry.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : inquiry.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {inquiry.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{inquiry.message}</p>
                  {inquiry.location && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <FiMapPin className="w-3 h-3" />
                      {inquiry.location}
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  {new Date(inquiry.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Helper Components ─── */

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
      />
    </label>
  );
}

function LocationInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const searchText = query.trim();
    if (searchText.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/locations/search?q=${encodeURIComponent(searchText)}`,
          { signal: controller.signal }
        );

        if (!response.ok) throw new Error('Failed to fetch locations');
        const results = (await response.json()) as LocationSuggestion[];
        setSuggestions(results);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Location suggestions failed:', error);
          setSuggestions([]);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <label className="relative block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="relative">
        <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            onChange(nextValue);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          required={required}
          placeholder={placeholder}
          className="mt-1 w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2.5 focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
        />
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <button
                key={`${suggestion.type}-${suggestion.id}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery(suggestion.display);
                  onChange(suggestion.display);
                  setOpen(false);
                }}
                className="block w-full px-4 py-3 text-left hover:bg-gray-50"
              >
                <span className="block text-sm font-medium text-gray-900">
                  {suggestion.display}
                </span>
                <span className="text-xs capitalize text-gray-500">
                  {suggestion.type}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              No matching locations
            </div>
          )}
        </div>
      )}
    </label>
  );
}
