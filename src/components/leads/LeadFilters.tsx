"use client";

import Button from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

interface LeadFiltersProps {
  onSearch: (query: string) => void;
  onFilterStatus: (status: string) => void;
  onFilterType: (type: string) => void;
  onReset: () => void;
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
}

export function LeadFilters({
  onSearch,
  onFilterStatus,
  onFilterType,
  onReset,
  searchQuery,
  statusFilter,
  typeFilter,
}: LeadFiltersProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CHAT":
        return "💬";
      case "PHONE":
        return "📞";
      case "EMAIL":
        return "📧";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder="Search leads..."
          className="max-w-[300px]"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={onFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="BASIC">Basic</SelectItem>
            <SelectItem value="SILVER">Silver</SelectItem>
            <SelectItem value="GOLD">Gold</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={onFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="CHAT">
              <span className="inline-flex items-center gap-2">
                {getTypeIcon("CHAT")} Chat
              </span>
            </SelectItem>
            <SelectItem value="PHONE">
              <span className="inline-flex items-center gap-2">
                {getTypeIcon("PHONE")} Phone
              </span>
            </SelectItem>
            <SelectItem value="EMAIL">
              <span className="inline-flex items-center gap-2">
                {getTypeIcon("EMAIL")} Email
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onReset}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
