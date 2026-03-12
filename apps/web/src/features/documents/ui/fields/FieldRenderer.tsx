/**
 * Field Renderer
 * 
 * Renders form fields dynamically based on field configuration.
 */

"use client";

import React from "react";
import type { DocumentFieldConfig } from "../../core/types";

interface FieldRendererProps {
  field: DocumentFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Render a single field based on its type
 */
export function FieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: FieldRendererProps) {
  const baseClasses = `
    w-full px-3 py-2 border rounded-md
    !bg-gray-900 !text-white !border-gray-700
    placeholder:!text-gray-500
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:!border-blue-500
    disabled:!bg-gray-800 disabled:!text-gray-400 disabled:cursor-not-allowed
    ${error ? "!border-red-500" : ""}
  `;

  switch (field.type) {
    case "text":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-medium !text-gray-200 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled}
            className={baseClasses}
            aria-describedby={field.helpText ? `${field.id}-help` : undefined}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="mt-1 text-sm !text-gray-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm !text-red-400">{error}</p>
          )}
        </div>
      );

    case "textarea":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-medium !text-gray-200 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled}
            rows={field.type === "textarea" ? 4 : undefined}
            className={baseClasses}
            aria-describedby={field.helpText ? `${field.id}-help` : undefined}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="mt-1 text-sm !text-gray-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm !text-red-400">{error}</p>
          )}
        </div>
      );

    case "number":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-medium !text-gray-200 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            value={Number(value) || ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled}
            className={baseClasses}
            aria-describedby={field.helpText ? `${field.id}-help` : undefined}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="mt-1 text-sm !text-gray-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm !text-red-400">{error}</p>
          )}
        </div>
      );

    case "currency":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-medium !text-gray-200 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "ARS 0"}
            required={field.required}
            disabled={disabled}
            className={baseClasses}
            aria-describedby={field.helpText ? `${field.id}-help` : undefined}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="mt-1 text-sm !text-gray-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm !text-red-400">{error}</p>
          )}
        </div>
      );

    case "date":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-medium !text-gray-200 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="date"
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={disabled}
            className={baseClasses}
            aria-describedby={field.helpText ? `${field.id}-help` : undefined}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="mt-1 text-sm !text-gray-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm !text-red-400">{error}</p>
          )}
        </div>
      );

    case "select":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-medium !text-gray-200 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={disabled}
            className={baseClasses}
            aria-describedby={field.helpText ? `${field.id}-help` : undefined}
          >
            {field.placeholder && (
              <option value="">{field.placeholder}</option>
            )}
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.helpText && (
            <p id={`${field.id}-help`} className="mt-1 text-sm !text-gray-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm !text-red-400">{error}</p>
          )}
        </div>
      );

    case "switch":
      return (
        <div data-field-id={field.id}>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="mr-2 h-4 w-4 !text-blue-500 focus:ring-blue-500 !border-gray-600 rounded !bg-gray-900"
            />
            <span className="text-sm font-medium !text-gray-200">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
          {field.helpText && (
            <p className="mt-1 text-sm !text-gray-400 ml-6">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm !text-red-400 ml-6">{error}</p>
          )}
        </div>
      );

    case "cuit":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-medium !text-gray-200 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "20-12345678-9"}
            required={field.required}
            disabled={disabled}
            pattern="[0-9]{2}-[0-9]{8}-[0-9]"
            className={baseClasses}
            aria-describedby={field.helpText ? `${field.id}-help` : undefined}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="mt-1 text-sm !text-gray-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm !text-red-400">{error}</p>
          )}
        </div>
      );

    case "address":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-medium !text-gray-200 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "Av. Corrientes 1234, CABA"}
            required={field.required}
            disabled={disabled}
            className={baseClasses}
            aria-describedby={field.helpText ? `${field.id}-help` : undefined}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="mt-1 text-sm !text-gray-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm !text-red-400">{error}</p>
          )}
        </div>
      );

    default:
      return (
        <div>
          <p className="text-sm text-red-600">
            Tipo de campo no soportado: {(field as any).type}
          </p>
        </div>
      );
  }
}

