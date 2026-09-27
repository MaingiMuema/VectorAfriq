"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Button from "@/components/ui/Button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Lead } from "@/types/lead";
import { formatDistance } from "date-fns";

interface LeadTableProps {
  leads: Lead[];
  onViewLead: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export function LeadTable({
  leads,
  onViewLead,
  onUpdateStatus,
}: LeadTableProps) {
  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case "BASIC":
        return "default";
      case "SILVER":
        return "secondary";
      case "GOLD":
        return "success";
      default:
        return "default";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CHAT":
        return "💬";
      case "PHONE":
        return "📞";
      case "EMAIL":
        return "📧";
      default:
        return "❓";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <span title={lead.type} className="text-xl">
                  {getTypeIcon(lead.type)}
                </span>
              </TableCell>
              <TableCell>
                {lead.property ? (
                  <div className="space-y-1">
                    <div className="font-medium">{lead.property.title}</div>
                    <div className="text-sm text-gray-500">
                      {lead.property.location}
                    </div>
                    <div className="text-sm text-gray-500">
                      KES {lead.property.price.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">No property data</span>
                )}
              </TableCell>
              <TableCell>
                {lead.user ? (
                  <div className="space-y-1">
                    <div className="font-medium">{lead.user.name}</div>
                    <div className="text-sm text-gray-500">
                      {lead.user.email}
                    </div>
                    {lead.user.phone && (
                      <div className="text-sm text-gray-500">
                        {lead.user.phone}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">No contact info</span>
                )}
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate">{lead.description}</div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(lead.status)}>
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell>
                {formatDistance(new Date(lead.createdAt), new Date(), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewLead(lead.id)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onUpdateStatus(
                        lead.id,
                        lead.status === "BASIC"
                          ? "SILVER"
                          : lead.status === "SILVER"
                          ? "GOLD"
                          : "BASIC"
                      )
                    }
                  >
                    Update Status
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
