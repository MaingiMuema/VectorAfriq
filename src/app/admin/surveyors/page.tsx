'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiCheck,
  FiSearch,
  FiX,
  FiMessageSquare,
  FiMapPin,
  FiClock,
  FiFilter,
} from 'react-icons/fi';

const statuses = ['ALL', 'NEW', 'READ', 'REPLIED', 'CLOSED'];
const serviceTypeLabels: Record<string, string> = {
  'title-verification': 'Title Verification',
  'property-surveying': 'Property Surveying',
  'boundary-survey': 'Boundary Survey',
  'legal-consultation': 'Legal Consultation',
  'conveyancing': 'Conveyancing',
  'documentation': 'Documentation Services',
  'property-valuation': 'Property Valuation',
  'land-search': 'Land Search (ArdhiSasa)',
  'ownership-transfer': 'Ownership Transfer',
  'land-dispute': 'Land Dispute Resolution',
};

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  serviceType: string;
  location: string | null;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [serviceType, setServiceType] = useState('ALL');
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState({
    NEW: 0,
    READ: 0,
    REPLIED: 0,
    CLOSED: 0,
  });

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status });
      if (search) params.append('search', search);
      if (serviceType !== 'ALL') params.append('serviceType', serviceType);
      const response = await fetch(`/api/admin/inquiries?${params}`);
      if (!response.ok) throw new Error('Failed to load inquiries');
      const data = await response.json();
      setInquiries(data.inquiries || []);
      setTotal(data.total || 0);
      if (data.statusCounts) {
        setStatusCounts(data.statusCounts);
      }
    } catch (error) {
      toast.error('Could not load inquiries');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search, status, serviceType]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const updateInquiryStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Failed to update inquiry');
      setInquiries((current) =>
        current.map((inq) => (inq.id === id ? data.inquiry : inq))
      );
      toast.success(`Inquiry marked as ${newStatus.toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Due Diligence Inquiries
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage client inquiries for survey, legal, and valuation services. VectorAfriq assigns verified professionals to fulfill each request.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {(['NEW', 'READ', 'REPLIED', 'CLOSED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                status === s
                  ? 'border-[#468AD1] bg-red-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-sm font-medium text-gray-700">{s}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  s === 'NEW'
                    ? 'bg-blue-100 text-blue-700'
                    : s === 'READ'
                    ? 'bg-yellow-100 text-yellow-700'
                    : s === 'REPLIED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {statusCounts[s]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, location, message..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === 'ALL' ? 'All Statuses' : item}
              </option>
            ))}
          </select>
          <div className="relative">
            <FiFilter className="absolute left-3 top-3.5 text-gray-400" />
            <select
              value={serviceType}
              onChange={(event) => setServiceType(event.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
            >
              <option value="ALL">All Service Types</option>
              {Object.entries(serviceTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-500">
          Loading inquiries...
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-500">
          <FiMessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>No inquiries found.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {total} inquiry{total !== 1 ? 'ies' : ''} found
          </p>
          <div className="grid grid-cols-1 gap-4">
            {inquiries.map((inquiry) => (
              <article
                key={inquiry.id}
                className={`rounded-lg border bg-white p-5 shadow-sm transition-colors ${
                  expandedId === inquiry.id
                    ? 'border-[#468AD1]'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === inquiry.id ? null : inquiry.id)
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-base font-semibold text-gray-900">
                        {inquiry.name}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          inquiry.status === 'NEW'
                            ? 'bg-blue-100 text-blue-700'
                            : inquiry.status === 'READ'
                            ? 'bg-yellow-100 text-yellow-700'
                            : inquiry.status === 'REPLIED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {inquiry.status}
                      </span>
                      <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                        {serviceTypeLabels[inquiry.serviceType] || inquiry.serviceType}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiMessageSquare className="w-3.5 h-3.5" />
                        {inquiry.email}
                      </span>
                      {inquiry.phone && (
                        <span>{inquiry.phone}</span>
                      )}
                      {inquiry.location && (
                        <span className="flex items-center gap-1">
                          <FiMapPin className="w-3.5 h-3.5" />
                          {inquiry.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3.5 h-3.5" />
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === inquiry.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                      {inquiry.message}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {inquiry.status !== 'READ' && (
                        <button
                          onClick={() => updateInquiryStatus(inquiry.id, 'READ')}
                          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                        >
                          <FiCheck className="mr-2 h-4 w-4" />
                          Mark Read
                        </button>
                      )}
                      {inquiry.status !== 'REPLIED' && (
                        <button
                          onClick={() => updateInquiryStatus(inquiry.id, 'REPLIED')}
                          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold bg-green-600 text-white hover:bg-green-700"
                        >
                          <FiCheck className="mr-2 h-4 w-4" />
                          Mark Replied
                        </button>
                      )}
                      {inquiry.status !== 'CLOSED' && (
                        <button
                          onClick={() => updateInquiryStatus(inquiry.id, 'CLOSED')}
                          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          <FiX className="mr-2 h-4 w-4" />
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
