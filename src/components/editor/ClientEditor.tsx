"use client";

import dynamic from "next/dynamic";

const ClientEditor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg border">
      <div className="text-gray-500">Loading editor...</div>
    </div>
  ),
});

export default ClientEditor;
