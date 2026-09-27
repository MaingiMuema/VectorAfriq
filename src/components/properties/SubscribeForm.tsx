"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Add subscribe logic here
    console.log("Subscribing email:", email);
  };

  return (
    <form onSubmit={handleSubscribe} className="space-y-2">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        type="submit"
        className="w-full px-4 py-2 bg-[#468AD1] text-white rounded-md text-sm hover:bg-[#514f63] transition-colors"
      >
        Subscribe Now
      </button>
    </form>
  );
}
