export default function Loading() {
  return (
    <div className="max-w mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-64 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-96 bg-gray-200 rounded"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="h-4 w-40 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index}>
              <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
