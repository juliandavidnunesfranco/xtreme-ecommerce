
export default function Loading() {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="border border-border rounded-lg p-4 animate-pulse"
            >
              <div className="bg-muted h-48 w-full rounded-md"></div>
              <div className="mt-4 space-y-3">
                <div className="bg-muted h-4 w-3/4 rounded"></div>
                <div className="bg-muted h-6 w-1/2 rounded"></div>
                <div className="bg-muted h-4 w-1/4 rounded ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
}
