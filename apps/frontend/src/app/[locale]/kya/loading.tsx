export default function Loading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-6 w-56 bg-gray-200 rounded mb-4"></div>

      <div className="bg-gray-100 border rounded-top p-3 mb-3">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-8 w-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>

      <div className="card border shadow-sm rounded-bottom">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="p-3 border rounded">
                <div className="h-4 w-40 bg-gray-200 rounded mb-3"></div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <div className="h-10 w-24 bg-gray-200 rounded"></div>
            <div className="h-10 w-28 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
