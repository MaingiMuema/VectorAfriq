export default function Loading() {
  return (
    <div className="pt-16 animate-pulse">
      <div className="w-full bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-64" />
        </div>
      </div>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-5 lg:py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-[calc(100%-30rem)] xl:w-3/4">
              {/* Header card */}
              <div className="bg-white border rounded-xl p-4 lg:p-5 mb-4">
                <div className="h-7 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="flex gap-3">
                  <div className="h-10 bg-gray-100 rounded-lg w-40" />
                  <div className="h-10 bg-gray-100 rounded-lg w-40" />
                </div>
              </div>

              {/* Category pills */}
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-9 bg-gray-200 rounded-full w-24 flex-shrink-0" />
                ))}
              </div>

              {/* Banner */}
              <div className="w-full aspect-[4/1] bg-gray-200 rounded-lg mb-4" />

              {/* Property list */}
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-4 bg-white border rounded-xl p-4">
                    <div className="w-full sm:w-64 h-48 sm:h-40 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-6 bg-gray-200 rounded w-1/3" />
                      <div className="flex gap-4 pt-2">
                        <div className="h-4 bg-gray-100 rounded w-12" />
                        <div className="h-4 bg-gray-100 rounded w-12" />
                        <div className="h-4 bg-gray-100 rounded w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-[30rem] xl:w-1/4 space-y-4">
              <div className="bg-white border rounded-xl p-4 h-64" />
              <div className="bg-white border rounded-xl p-4 h-96" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
