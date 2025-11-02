import { cn } from "@/app/lib/utils";

interface DocumentStatusBadgeProps {
  status: string;
  className?: string;
}

export function DocumentStatusBadge({
  status,
  className,
}: DocumentStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  const getStatusStyles = () => {
    switch (normalizedStatus) {
      case "borrador":
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "final":
      case "firmado":
      case "completed":
      case "generated":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "error":
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      case "processing":
      case "generating":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = () => {
    switch (normalizedStatus) {
      case "borrador":
      case "draft":
        return "Borrador";
      case "final":
      case "completed":
      case "generated":
        return "Finalizado";
      case "firmado":
        return "Firmado";
      case "error":
      case "failed":
        return "Error";
      case "processing":
      case "generating":
        return "Procesando";
      default:
        return status;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border",
        "transition-colors duration-200",
        getStatusStyles(),
        className
      )}
    >
      {getStatusLabel()}
    </span>
  );
}
