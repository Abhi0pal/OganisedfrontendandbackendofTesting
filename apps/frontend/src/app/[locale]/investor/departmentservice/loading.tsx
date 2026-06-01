export default function Loading() {
  return (
    <div className="max-w mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-80 bg-gray-200 rounded mb-3"></div>
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
      </div>

      <div className="mb-6">
        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-10 w-full bg-gray-200 rounded"></div>
      </div>

      <div className="overflow-x-auto rounded-md shadow-lg border border-gray-200">
        <div className="h-10 bg-gray-200"></div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid grid-cols-5 gap-4 px-4 py-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="h-10 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
