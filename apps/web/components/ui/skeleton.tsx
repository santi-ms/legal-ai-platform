import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className, variant = "rectangular" }: SkeletonProps) {
  const baseClasses = "animate-pulse bg-neutral-800";
  
  const variantClasses = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}

// Variantes predefinidas para casos comunes
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
      <Skeleton variant="rectangular" className="h-6 w-3/4" />
      <Skeleton variant="rectangular" className="h-4 w-full" />
      <Skeleton variant="rectangular" className="h-4 w-5/6" />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="rectangular" className="h-10 w-20" />
        <Skeleton variant="rectangular" className="h-10 w-20" />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton variant="text" className="h-4 w-32" />
            <Skeleton variant="text" className="h-3 w-16" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton variant="text" className="h-4 w-24" />
      </td>
      <td className="px-6 py-4">
        <Skeleton variant="rectangular" className="h-6 w-20 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <Skeleton variant="text" className="h-4 w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <Skeleton variant="rectangular" className="h-8 w-16" />
          <Skeleton variant="rectangular" className="h-8 w-16" />
        </div>
      </td>
    </tr>
  );
}

export function SkeletonDocumentDetail() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton variant="text" className="h-10 w-64" />
        <Skeleton variant="text" className="h-6 w-96" />
      </div>

      {/* Metadata Cards */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton variant="text" className="h-3 w-32" />
              <Skeleton variant="text" className="h-4 w-40" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <Skeleton variant="text" className="h-6 w-40" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
          {[...Array(15)].map((_, i) => (
            <Skeleton
              key={i}
              variant="text"
              className={`h-4 ${
                i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-4/6"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

