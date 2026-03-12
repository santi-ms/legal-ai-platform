/**
 * Dynamic Form
 * 
 * Renders a form dynamically based on a document schema.
 */

"use client";

import React, { useState, useCallback } from "react";
import type { DocumentSchemaDefinition } from "../../core/types";
import { FieldRenderer } from "../fields/FieldRenderer";
import { validateFormData, type ValidationResult } from "../../core/validation";

interface DynamicFormProps {
  schema: DocumentSchemaDefinition;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  onChange?: (data: Record<string, unknown>) => void;
  disabled?: boolean;
}

/**
 * Dynamic form component
 */
export function DynamicForm({
  schema,
  initialData = {},
  onSubmit,
  onChange,
  disabled = false,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = useCallback(
    (fieldId: string, value: unknown) => {
      const newData = { ...formData, [fieldId]: value };
      setFormData(newData);
      
      // Clear error for this field
      if (errors[fieldId]) {
        const newErrors = { ...errors };
        delete newErrors[fieldId];
        setErrors(newErrors);
      }
      
      // Notify parent of change
      if (onChange) {
        onChange(newData);
      }
    },
    [formData, errors, onChange]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate
      const validationResult = validateFormData(formData, schema);
      
      if (!validationResult.valid) {
        const newErrors: Record<string, string> = {};
        validationResult.errors.forEach((error) => {
          if (error.fieldId) {
            newErrors[error.fieldId] = error.message;
          }
        });
        setErrors(newErrors);
        return;
      }
      
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, schema, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {schema.sections.map((section) => (
        <div key={section.id} className="border-b border-gray-200 pb-6 last:border-b-0">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            {section.description && (
              <p className="mt-1 text-sm text-gray-500">{section.description}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field) => {
              // Check visibility conditions
              if (field.visibleWhen) {
                const shouldShow = field.visibleWhen.every((condition) => {
                  // Simple condition: fieldId should be truthy
                  return Boolean(formData[condition]);
                });
                
                if (!shouldShow) {
                  return null;
                }
              }
              
              return (
                <div
                  key={field.id}
                  className={field.type === "textarea" ? "md:col-span-2" : ""}
                >
                  <FieldRenderer
                    field={field}
                    value={formData[field.id]}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    error={errors[field.id]}
                    disabled={disabled || isSubmitting}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Generando..." : "Generar Documento"}
        </button>
      </div>
    </form>
  );
}

