"use client";

interface PricingStepProps {
  data: {
    price: number;
    priceUnit: "total" | "sqft";
    negotiable: boolean;
    paymentTerms?: string;
  };
  onChange: (data: Partial<PricingStepProps["data"]>) => void;
}

export default function PricingStep({ data, onChange }: PricingStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Price (KES)
          </label>
          <input
            type="number"
            id="price"
            value={data.price}
            onChange={(e) => onChange({ price: parseFloat(e.target.value) })}
            min="0"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
          />
        </div>
        <div>
          <label
            htmlFor="priceUnit"
            className="block text-sm font-medium text-gray-700"
          >
            Price Unit
          </label>
          <select
            id="priceUnit"
            value={data.priceUnit}
            onChange={(e) =>
              onChange({ priceUnit: e.target.value as "total" | "sqft" })
            }
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
          >
            <option value="total">Total Price</option>
            <option value="sqft">Per Square Foot</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="negotiable"
            checked={data.negotiable}
            onChange={(e) => onChange({ negotiable: e.target.checked })}
            className="h-4 w-4 text-[#468AD1] focus:ring-[#468AD1] border-gray-300 rounded"
          />
          <label
            htmlFor="negotiable"
            className="ml-2 block text-sm text-gray-700"
          >
            Price is negotiable
          </label>
        </div>
      </div>

      <div>
        <label
          htmlFor="paymentTerms"
          className="block text-sm font-medium text-gray-700"
        >
          Payment Terms (Optional)
        </label>
        <select
          id="paymentTerms"
          value={data.paymentTerms || ""}
          onChange={(e) => onChange({ paymentTerms: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
        >
          <option value="">Select payment terms</option>
          <option value="Cash">Cash</option>
          <option value="Mortgage">Mortgage</option>
          <option value="Installments">Installments</option>
          <option value="Cash and Mortgage">Cash and Mortgage</option>
          <option value="Rent to Own">Rent to Own</option>
        </select>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">
          Price Guidelines
        </h4>
        <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
          <li>Set competitive prices based on market research</li>
          <li>Consider location, property condition, and amenities</li>
          <li>Be clear about what&apos;s included in the price</li>
          <li>If negotiable, have a minimum acceptable price in mind</li>
        </ul>
      </div>
    </div>
  );
}
