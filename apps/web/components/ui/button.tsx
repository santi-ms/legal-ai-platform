import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const styles =
      variant === "outline"
        ? "border border-gray-600 text-white hover:bg-gray-800"
        : "bg-green-600 hover:bg-green-700 text-white";

    return (
      <button
        ref={ref}
        className={cn(
          "px-4 py-2 rounded-md text-sm font-medium transition-colors",
          styles,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
