import { Suspense } from "react";
import { ReportedContentList } from "./components/ReportedContentList";

export const metadata = {
  title: "Reported Content - Admin Dashboard",
};

export default function ReportedContentPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reported Content</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage reported content across the platform
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <Suspense fallback={<div>Loading...</div>}>
          <ReportedContentList />
        </Suspense>
      </div>
    </div>
  );
}
