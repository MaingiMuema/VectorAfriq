"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface Property {
  id: string;
  title: string;
  price: number;
  userId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface TransactionFormProps {
  property?: Property;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TransactionForm({
  property,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [buyers, setBuyers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    propertyId: property?.id || "",
    buyerId: "",
    type: "SALE",
    amount: property?.price || 0,
    notes: "",
  });

  // Fetch potential buyers when component mounts
  useState(async () => {
    try {
      const response = await fetch("/api/admin/users?role=USER");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setBuyers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sellerId: property?.userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create transaction");
      }

      toast.success("Transaction created successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Property Details (if not provided) */}
      {!property && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Property
          </label>
          <input
            type="text"
            value={formData.propertyId}
            onChange={(e) =>
              setFormData({ ...formData, propertyId: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            required
          />
        </div>
      )}

      {/* Buyer Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Buyer</label>
        <Select
          value={formData.buyerId}
          onValueChange={(value) =>
            setFormData({ ...formData, buyerId: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a buyer" />
          </SelectTrigger>
          <SelectContent>
            {buyers.map((buyer) => (
              <SelectItem key={buyer.id} value={buyer.id}>
                {buyer.name} ({buyer.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SALE">Sale</SelectItem>
            <SelectItem value="RENT">Rent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) =>
            setFormData({ ...formData, amount: parseFloat(e.target.value) })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
          required
          min={0}
          step={0.01}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {loading ? "Creating..." : "Create Transaction"}
        </button>
      </div>
    </form>
  );
}
