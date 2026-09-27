"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { formatDistanceToNow } from "date-fns";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
import { toast } from "sonner";
import { Loader2, Trash2, ExternalLink, MessageSquare } from "lucide-react";

interface Report {
  id: string;
  contentType: string;
  contentId: string;
  reason: string;
  description?: string | null;
  status: ReportStatus;
  notes?: string | null;
  createdAt: string;
  reporter: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

const statusColors = {
  PENDING: "bg-yellow-500",
  REVIEWED: "bg-blue-500",
  RESOLVED: "bg-green-500",
  DISMISSED: "bg-gray-500",
};

export function ReportedContentList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/reported-content?page=${page}&limit=10${
          searchParams.toString() ? `&${searchParams.toString()}` : ""
        }`
      );
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data.reports);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reported content");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchParams]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateStatus = async (
    id: string,
    status: ReportStatus,
    notes?: string
  ) => {
    try {
      const res = await fetch("/api/admin/reported-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, notes }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      const updatedReport = await res.json();
      setReports(
        reports.map((report) => (report.id === id ? updatedReport : report))
      );
      setExpandedId(null);
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const res = await fetch("/api/admin/reported-content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete report");

      setReports(reports.filter((report) => report.id !== id));
      setTotal((prev) => prev - 1);
      toast.success("Report deleted successfully");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Select
          value={searchParams.get("status") || "all"}
          onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value !== "all") {
              params.set("status", value);
            } else {
              params.delete("status");
            }
            router.push(`?${params.toString()}`);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REVIEWED">Reviewed</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="DISMISSED">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reporter</TableHead>
              <TableHead>Content Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {report.reporter.name || "Unknown"}
                      </span>
                      {report.reporter.email && (
                        <span className="text-xs text-gray-500">
                          {report.reporter.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {report.contentType}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {report.reason}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    {report.description ? (
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === report.id ? null : report.id
                          )
                        }
                        className="text-left text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2 decoration-dotted"
                      >
                        {report.description.length > 40
                          ? `${report.description.substring(0, 40)}...`
                          : report.description}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[report.status]}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(report.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        {report.contentType === "PROPERTY" && (
                          <Link
                            href={`/admin/properties/${report.contentId}`}
                            target="_blank"
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                            title="View listing"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedId(
                              expandedId === report.id ? null : report.id
                            )
                          }
                          className="p-1.5"
                          title="Review & add notes"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5"
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to delete this report?"
                              )
                            ) {
                              deleteReport(report.id);
                            }
                          }}
                          title="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Expanded detail panel */}
      {expandedId && (() => {
        const report = reports.find((r) => r.id === expandedId);
        if (!report) return null;
        return (
          <div className="mt-4 p-5 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Report Details
              </h3>
              <button
                onClick={() => setExpandedId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Reporter</p>
                <p className="text-sm font-medium text-gray-900">
                  {report.reporter.name || "Unknown"}
                  {report.reporter.email && (
                    <span className="text-gray-500 font-normal">
                      {" "}
                      ({report.reporter.email})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Content</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {report.contentType} — {report.contentId}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Reason</p>
                <p className="text-sm font-medium text-gray-900">
                  {report.reason}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Submitted</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {report.description && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">User Description</p>
                <p className="text-sm text-gray-700 bg-white p-3 rounded border whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>
            )}

            {report.notes && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Admin Notes</p>
                <p className="text-sm text-gray-700 bg-white p-3 rounded border whitespace-pre-wrap">
                  {report.notes}
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (optional — included in email to reporter)
              </label>
              <textarea
                value={notesInput[report.id] ?? report.notes ?? ""}
                onChange={(e) =>
                  setNotesInput({ ...notesInput, [report.id]: e.target.value })
                }
                rows={2}
                placeholder="Add internal notes or a message for the reporter..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none mb-3"
              />

              <div className="flex gap-2 flex-wrap">
                <Select
                  defaultValue={report.status}
                  onValueChange={(value) => {
                    const notes = notesInput[report.id] || undefined;
                    updateStatus(report.id, value as ReportStatus, notes);
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="DISMISSED">Dismissed</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const notes = notesInput[report.id] || undefined;
                    updateStatus(report.id, report.status, notes);
                  }}
                >
                  Save Notes
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-muted-foreground">
          Total: {total} reports
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page * 10 >= total || isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
