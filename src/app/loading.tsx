import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Skeleton Navbar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-6xl flex gap-3">
          <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
          <div className="h-10 w-12 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        
        {/* Spinner */}
        <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
          {[...Array(8)].map((_, i) => (
            <div 
                key={i} 
                className="group relative flex w-full flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100"
            >
              {/* Image Skeleton */}
              <div className="aspect-square w-full animate-pulse bg-gray-200" />
              
              {/* Content Skeleton */}
              <div className="flex flex-1 flex-col p-4 w-full space-y-3">
                 <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                 <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                 
                 <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
                    <div className="h-5 w-12 animate-pulse rounded-full bg-gray-200" />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
