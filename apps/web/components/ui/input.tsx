import * as React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "bg-neutral-800 border border-neutral-700 text-white rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
