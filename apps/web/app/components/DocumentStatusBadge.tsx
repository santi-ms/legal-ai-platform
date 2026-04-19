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
        return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600";
      case "final":
      case "firmado":
      case "completed":
      case "generated":
      case "generated_text":
        return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "needs_review":
        return "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "error":
      case "failed":
        return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
      case "processing":
      case "generating":
        return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600";
    }
  };

  const getStatusLabel = () => {
    switch (normalizedStatus) {
      case "borrador":
      case "draft":
        return "Borrador";
      case "final":
      case "completed":
        return "Finalizado";
      case "generated":
      case "generated_text":
        return "Generado";
      case "firmado":
        return "Firmado";
      case "needs_review":
        return "Requiere revisión";
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
