'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  FiSearch,
  FiFilter,
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiMessageSquare,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiSend,
  FiLoader,
} from 'react-icons/fi';

/* ──────────── Types ──────────── */

interface Inquiry {
  id: string;
  servicePage: string;
  name: string;
  email: string;
  phone: string | null;
  serviceType: string;
  location: string | null;
  propertyUrl: string | null;
  message: string;
  extraFields: Record<string, string> | null;
  status: 'NEW' | 'READ' | 'REPLIED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-100' },
  READ: { label: 'Read', color: 'text-amber-700', bg: 'bg-amber-100' },
  REPLIED: { label: 'Replied', color: 'text-green-700', bg: 'bg-green-100' },
  CLOSED: { label: 'Closed', color: 'text-gray-600', bg: 'bg-gray-100' },
};

const statusFilters = ['ALL', 'NEW', 'READ', 'REPLIED', 'CLOSED'];

const servicePageLabels: Record<string, string> = {
  'property-valuation': 'Property Valuation',
  'survey-mapping': 'Survey & Mapping',
  'legal-conveyancing': 'Legal / Conveyancing',
  'mortgage-assistance': 'Mortgage Assistance',
  'architectural-construction': 'Architectural & Construction',
  'movers': 'Movers',
  'property-management': 'Property Management',
  'diaspora-services': 'Diaspora Services',
};

const serviceTypeLabels: Record<string, string> = {
  // Service page slugs (new inquiry flow — serviceType now stores the service slug)
  'property-valuation': 'Property Valuation',
  'survey-mapping': 'Survey & Mapping',
  'legal-conveyancing': 'Legal / Conveyancing',
  'mortgage-assistance': 'Mortgage Assistance',
  'architectural-construction': 'Architectural & Construction',
  'movers': 'Movers',
  'property-management': 'Property Management',
  'diaspora-services': 'Diaspora Services',
  // Legacy sub-type values (for older inquiries in the database)
  'market-valuation': 'Market Valuation',
  'forced-sale-valuation': 'Forced Sale Valuation',
  'mortgage-valuation': 'Mortgage Valuation',
  'insurance-valuation': 'Insurance Valuation',
  'investment-advisory': 'Investment Advisory',
  'red-book-valuation': 'Red Book Valuation',
  'boundary-survey': 'Boundary Survey',
  'beacon-placement': 'Beacon Placement',
  'land-subdivision': 'Land Subdivision',
  'topographic-mapping': 'Topographic Mapping',
  'site-analysis': 'Site Analysis',
  'cadastral-mapping': 'Cadastral Mapping',
  'title-verification': 'Title Verification',
  'sale-agreement': 'Sale Agreement Drafting',
  'land-search': 'Land Search',
  'conveyancing': 'Conveyancing',
  'ownership-transfer': 'Ownership Transfer',
  'land-dispute': 'Land Dispute Resolution',
  'pre-approval-guidance': 'Pre-Approval Guidance',
  'bank-comparison': 'Bank & Product Comparison',
  'affordability-assessment': 'Affordability Assessment',
  'application-support': 'Application Support',
  'refinancing-advisory': 'Refinancing Advisory',
  'architectural-design': 'Architectural Design',
  'structural-engineering': 'Structural Engineering',
  'quantity-surveying': 'Quantity Surveying',
  'bill-of-quantities': 'Bill of Quantities',
  'construction-supervision': 'Construction Supervision',
  'project-management': 'Project Management',
  'household-relocation': 'Household Relocation',
  'office-moving': 'Office Moving',
  'vehicle-transport': 'Vehicle Transport',
  'packing-services': 'Packing Services',
  'storage-solutions': 'Storage Solutions',
  'tenant-screening': 'Tenant Screening',
  'rent-collection': 'Rent Collection',
  'property-maintenance': 'Property Maintenance',
  'lease-management': 'Lease Management',
  'inspections': 'Inspections',
  'financial-reporting': 'Financial Reporting',
  'remote-buying': 'Remote Property Buying',
  'remote-selling': 'Remote Property Selling',
  'diaspora-management': 'Property Management',
  'legal-representation': 'Legal Representation',
  'diaspora-mortgage': 'Diaspora Mortgage Guidance',
};

/* ──────────── Page Component ──────────── */

export default function AdminServiceInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({ NEW: 0, READ: 0, REPLIED: 0, CLOSED: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [servicePageFilter, setServicePageFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '15');
      if (search) params.set('search', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (servicePageFilter !== 'ALL') params.set('servicePage', servicePageFilter);

      const res = await fetch(`/api/admin/service-inquiries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
        setTotal(data.total || 0);
        setTotalPages(data.pages || 1);
        if (data.statusCounts) setStatusCounts(data.statusCounts);
      }
    } catch (err) {
      console.error('Failed to load service inquiries', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, servicePageFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/service-inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.id === id
            ? { ...inquiry, status: newStatus as Inquiry['status'] }
            : inquiry
        )
      );
      toast.success(`Inquiry marked as ${newStatus.toLowerCase()}`);
    } catch (err) {
      toast.error('Failed to update inquiry status');
      console.error('Failed to update inquiry status', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Service Inquiries
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage client inquiries from all service pages. Track, filter, and respond to requests across valuation, survey, legal, mortgage, architecture, movers, property management, and diaspora services.
        </p>

        {/* Status Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {(['NEW', 'READ', 'REPLIED', 'CLOSED'] as const).map((s) => {
            const config = statusConfig[s];
            return (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(statusFilter === s ? 'ALL' : s);
                  setCurrentPage(1);
                }}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  statusFilter === s
                    ? 'border-[#468AD1] bg-red-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium text-gray-700">{config.label}</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}
                >
                  {statusCounts[s]}
                </span>
              </button>
            );
          })}
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
              onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
              placeholder="Search name, email, location, message..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
            />
          </div>
          <select
            value={servicePageFilter}
            onChange={(event) => { setServicePageFilter(event.target.value); setCurrentPage(1); }}
            className="rounded-lg border border-gray-200 px-3 py-2.5 focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
          >
            <option value="ALL">All Services</option>
            {Object.entries(servicePageLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <div className="relative">
            <FiFilter className="absolute left-3 top-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
            >
              {statusFilters.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All Statuses' : statusConfig[s]?.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? 'Loading...' : `${total} inquiry total`}
        </p>
        {!loading && totalPages > 1 && (
          <p className="text-xs text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Inquiry List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <FiMessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No inquiries found</h3>
          <p className="text-gray-500 text-sm">
            {search || statusFilter !== 'ALL' || servicePageFilter !== 'ALL'
              ? 'Try adjusting your search or filters.'
              : 'No service inquiries have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => {
            const config = statusConfig[inquiry.status] || statusConfig.NEW;
            const isExpanded = expandedId === inquiry.id;

            return (
              <div
                key={inquiry.id}
                className={`bg-white rounded-xl shadow-sm border transition-all ${
                  inquiry.status === 'NEW'
                    ? 'border-blue-200 bg-blue-50/30'
                    : 'border-gray-100'
                } ${isExpanded ? 'ring-2 ring-[#468AD1]/30' : ''}`}
              >
                {/* Inquiry Header */}
                <div
                  className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : inquiry.id);
                    if (inquiry.status === 'NEW') {
                      updateStatus(inquiry.id, 'READ');
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#514f63] to-[#3d3b4e] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {inquiry.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {inquiry.name}
                        </h3>
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs bg-[#514f63]/10 text-[#514f63] px-2 py-0.5 rounded-full font-semibold">
                          {servicePageLabels[inquiry.servicePage] || inquiry.servicePage}
                        </span>
                        {inquiry.serviceType && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {serviceTypeLabels[inquiry.serviceType] || inquiry.serviceType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <FiMail className="w-3 h-3" />
                          {inquiry.email}
                        </span>
                        {inquiry.phone && (
                          <span className="inline-flex items-center gap-1">
                            <FiPhone className="w-3 h-3" />
                            {inquiry.phone}
                          </span>
                        )}
                        {inquiry.location && (
                          <span className="inline-flex items-center gap-1">
                            <FiMapPin className="w-3 h-3" />
                            {inquiry.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <div className="text-gray-400 flex-shrink-0">
                      <svg
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 sm:p-5 bg-gray-50/50">
                    {/* Message */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Message</h4>
                      <p className="text-sm text-gray-700 leading-relaxed bg-white rounded-lg p-4 border border-gray-100">
                        {inquiry.message}
                      </p>
                    </div>

                    {/* Extra Fields (dynamic per-service details) */}
                    {inquiry.extraFields && Object.keys(inquiry.extraFields).length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Service Details</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {Object.entries(inquiry.extraFields)
                            .filter(([, v]) => v)
                            .map(([key, value]) => {
                              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
                              return (
                                <div key={key} className="bg-white rounded-lg p-3 border border-gray-100">
                                  <p className="text-xs text-gray-500">{label}</p>
                                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500">Service Page</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {servicePageLabels[inquiry.servicePage] || inquiry.servicePage}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500">Service Type</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {serviceTypeLabels[inquiry.serviceType] || inquiry.serviceType}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {inquiry.location || 'Not specified'}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500">Submitted</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(inquiry.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Property URL */}
                    {inquiry.propertyUrl && (
                      <div className="mb-4">
                        <a
                          href={inquiry.propertyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-[#468AD1] hover:underline"
                        >
                          <FiExternalLink className="w-3.5 h-3.5" />
                          View Property
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500 mr-1">Mark as:</span>
                      {inquiry.status !== 'READ' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(inquiry.id, 'READ'); }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <FiEye className="w-3 h-3" />
                          Read
                        </button>
                      )}
                      {inquiry.status !== 'REPLIED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(inquiry.id, 'REPLIED'); }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <FiCheckCircle className="w-3 h-3" />
                          Replied
                        </button>
                      )}
                      {inquiry.status !== 'CLOSED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(inquiry.id, 'CLOSED'); }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <FiXCircle className="w-3 h-3" />
                          Close
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyingId(replyingId === inquiry.id ? null : inquiry.id);
                          setReplyText('');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#468AD1]/10 text-[#468AD1] rounded-lg hover:bg-[#468AD1]/20 transition-colors ml-auto"
                      >
                        <FiMail className="w-3 h-3" />
                        {replyingId === inquiry.id ? 'Cancel Reply' : 'Reply via Email'}
                      </button>
                    </div>

                    {/* Inline Reply Form */}
                    {replyingId === inquiry.id && (
                      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FiMail className="w-4 h-4 text-[#468AD1]" />
                          <h4 className="text-sm font-semibold text-gray-900">
                            Reply to {inquiry.name}
                          </h4>
                          <span className="text-xs text-gray-500">({inquiry.email})</span>
                        </div>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={4}
                          placeholder="Type your reply message here..."
                          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1] mb-3"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); setReplyingId(null); setReplyText(''); }}
                            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!replyText.trim()) {
                                toast.error('Please type a reply message');
                                return;
                              }
                              setSendingReply(true);
                              try {
                                const res = await fetch('/api/admin/service-inquiries/reply', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: inquiry.id, replyMessage: replyText }),
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error || 'Failed to send reply');
                                toast.success(`Reply sent to ${inquiry.name}`);
                                setReplyingId(null);
                                setReplyText('');
                                setInquiries((prev) =>
                                  prev.map((inq) =>
                                    inq.id === inquiry.id ? { ...inq, status: 'REPLIED' as Inquiry['status'] } : inq
                                  )
                                );
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : 'Failed to send reply');
                              } finally {
                                setSendingReply(false);
                              }
                            }}
                            disabled={sendingReply}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] transition-colors disabled:opacity-60"
                          >
                            {sendingReply ? (
                              <><FiLoader className="w-3 h-3 animate-spin" /> Sending...</>
                            ) : (
                              <><FiSend className="w-3 h-3" /> Send Reply</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (totalPages <= 7) return true;
              if (page === 1 || page === totalPages) return true;
              if (Math.abs(page - currentPage) <= 1) return true;
              return false;
            })
            .reduce<(number | string)[]>((acc, page, idx, arr) => {
              if (idx > 0 && typeof arr[idx - 1] === 'number' && page - (arr[idx - 1] as number) > 1) {
                acc.push('...');
              }
              acc.push(page);
              return acc;
            }, [])
            .map((page, idx) => (
              <button
                key={idx}
                onClick={() => typeof page === 'number' ? setCurrentPage(page) : undefined}
                disabled={page === '...'}
                className={`min-w-[36px] px-3 py-2 rounded-lg border text-sm font-medium ${
                  page === currentPage
                    ? 'bg-[#468AD1] text-white border-[#468AD1]'
                    : page === '...'
                    ? 'bg-white text-gray-400 border-gray-100 cursor-default'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
