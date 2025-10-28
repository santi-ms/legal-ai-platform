"use client";
import * as React from "react";

export function Switch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="appearance-none w-11 h-6 bg-neutral-700 rounded-full cursor-pointer relative transition-all duration-200
        before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-5 before:h-5 before:bg-white before:rounded-full before:transition-all
        checked:bg-green-600 checked:before:translate-x-5"
    />
  );
}
