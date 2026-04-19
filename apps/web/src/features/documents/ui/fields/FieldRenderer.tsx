/**
 * Field Renderer
 * 
 * Renders form fields dynamically based on field configuration.
 */

"use client";

import React from "react";
import type { DocumentFieldConfig } from "../../core/types";
import { darkModeClasses, darkBorderColors } from "../styles/dark-mode";

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
    w-full px-3 py-2 border rounded-lg
    bg-white dark:bg-slate-800
    text-slate-900 dark:text-slate-100
    border-slate-300 dark:border-slate-600
    ${error ? 'border-red-500 dark:border-red-500' : ''}
    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
    disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    transition-all
  `;

  switch (field.type) {
    case "text":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
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
            <p id={`${field.id}-help`} className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      );

    case "textarea":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled}
            rows={field.rows ?? 4}
            className={baseClasses}
            aria-describedby={field.helpText ? `${field.id}-help` : undefined}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      );

    case "number":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
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
            <p id={`${field.id}-help`} className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      );

    case "currency":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
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
            <p id={`${field.id}-help`} className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      );

    case "date":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
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
            <p id={`${field.id}-help`} className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      );

    case "select":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
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
            <p id={`${field.id}-help`} className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
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
              className="mr-2 h-4 w-4 text-primary focus:ring-primary border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
            />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
          {field.helpText && (
            <p className="mt-1 text-sm ml-6 text-slate-600 dark:text-slate-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm ml-6 text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      );

    case "cuit":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
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
            <p id={`${field.id}-help`} className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      );

    case "address":
      return (
        <div data-field-id={field.id}>
          <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
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
            <p id={`${field.id}-help`} className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              {field.helpText}
            </p>
          )}
          {error && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
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

