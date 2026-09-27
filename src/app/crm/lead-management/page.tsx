"use client";

import { useEffect, useState, useCallback } from "react";
import { LeadTable } from "@/components/leads/LeadTable";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { Pagination } from "@/components/ui/Pagination";
import { Lead } from "@/types/lead";
import { toast } from "sonner";

interface PaginationData {
  total: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export default function LeadManagementPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    perPage: 10,
  });

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.perPage.toString(),
      });

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const response = await fetch(`/api/crm/leads?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch leads");

      const data = await response.json();
      setLeads(data.leads);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter, pagination.currentPage, pagination.perPage]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, searchQuery, statusFilter, typeFilter, pagination.currentPage]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page on new search
  };

  const handleFilterStatus = (status: string) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterType = (type: string) => {
    setTypeFilter(type);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleViewLead = (id: string) => {
    // TODO: Implement view lead details logic
    console.log("Viewing lead:", id);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update lead status");

      // Refresh leads after successful update
      fetchLeads();
      toast.success("Lead status updated successfully");
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast.error("Failed to update lead status");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lead Management</h1>
      </div>

      <LeadFilters
        onSearch={handleSearch}
        onFilterStatus={handleFilterStatus}
        onFilterType={handleFilterType}
        onReset={handleResetFilters}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
      />

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          </div>
        ) : (
          <>
            <LeadTable
              leads={leads}
              onViewLead={handleViewLead}
              onUpdateStatus={handleUpdateStatus}
            />
            {leads.length > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(page: number) =>
                  setPagination((prev) => ({ ...prev, currentPage: page }))
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
