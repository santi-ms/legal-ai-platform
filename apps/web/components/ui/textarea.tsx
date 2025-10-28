import * as React from "react";
import { cn } from "../../lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "bg-neutral-800 border border-neutral-700 text-white rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
