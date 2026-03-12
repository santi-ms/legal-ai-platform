/**
 * Legal Summary
 * 
 * Displays a structured legal summary of the document data before generation.
 */

"use client";

import React from "react";
import type { StructuredDocumentData } from "../../core/types";

interface LegalSummaryProps {
  documentType: string;
  data: StructuredDocumentData;
  onEdit?: () => void;
}

/**
 * Legal summary component
 */
export function LegalSummary({
  documentType,
  data,
  onEdit,
}: LegalSummaryProps) {
  const renderServiceContractSummary = () => {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold !text-gray-200">Partes</h4>
          <p className="text-sm !text-gray-300">
            <strong>Proveedor:</strong> {data.proveedor_nombre} ({data.proveedor_doc})
          </p>
          <p className="text-sm text-gray-600">
            <strong>Cliente:</strong> {data.cliente_nombre} ({data.cliente_doc})
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900">Servicio</h4>
          <p className="text-sm !text-gray-300">{data.descripcion_servicio}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900">Términos Comerciales</h4>
          <p className="text-sm text-gray-600">
            <strong>Monto:</strong> {data.monto} {data.moneda}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Periodicidad:</strong> {data.periodicidad}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Forma de pago:</strong> {data.forma_pago}
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900">Vigencia</h4>
          <p className="text-sm text-gray-600">
            <strong>Inicio:</strong> {data.inicio_vigencia}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Plazo mínimo:</strong> {data.plazo_minimo_meses} meses
          </p>
        </div>
        
        {data.confidencialidad && (
          <div>
            <h4 className="font-semibold text-gray-900">Confidencialidad</h4>
            <p className="text-sm text-gray-600">
              Plazo: {data.plazo_confidencialidad} años
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderNDASummary = () => {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold !text-gray-200">Partes</h4>
          <p className="text-sm !text-gray-300">
            <strong>Revelador:</strong> {data.revelador_nombre} ({data.revelador_doc})
          </p>
          <p className="text-sm text-gray-600">
            <strong>Receptor:</strong> {data.receptor_nombre} ({data.receptor_doc})
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900">Información Confidencial</h4>
          <p className="text-sm text-gray-600">{data.definicion_informacion}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900">Finalidad Permitida</h4>
          <p className="text-sm text-gray-600">{data.finalidad_permitida}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900">Plazo de Confidencialidad</h4>
          <p className="text-sm text-gray-600">{data.plazo_confidencialidad} años</p>
        </div>
      </div>
    );
  };

  const renderLegalNoticeSummary = () => {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold !text-gray-200">Partes</h4>
          <p className="text-sm !text-gray-300">
            <strong>Remitente:</strong> {data.remitente_nombre} ({data.remitente_doc})
          </p>
          <p className="text-sm text-gray-600">
            <strong>Destinatario:</strong> {data.destinatario_nombre} ({data.destinatario_doc})
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900">Contexto</h4>
          <p className="text-sm text-gray-600">{data.relacion_previa}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900">Hechos</h4>
          <p className="text-sm text-gray-600">{data.hechos}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900">Intimación</h4>
          <p className="text-sm text-gray-600">{data.intimacion}</p>
          <p className="text-sm text-gray-600">
            <strong>Plazo:</strong> {data.plazo_cumplimiento}
          </p>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    switch (documentType) {
      case "service_contract":
        return renderServiceContractSummary();
      case "nda":
        return renderNDASummary();
      case "legal_notice":
        return renderLegalNoticeSummary();
      default:
        return <p className="text-sm !text-gray-300">Resumen no disponible</p>;
    }
  };

  return (
    <div className="!bg-gray-900 rounded-lg shadow-sm !border !border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold !text-white">Resumen Jurídico</h3>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-sm !text-blue-400 hover:!text-blue-300 transition-colors"
          >
            Editar
          </button>
        )}
      </div>
      
      {renderSummary()}
      
      <div className="mt-6 pt-4 border-t !border-gray-700">
        <p className="text-xs !text-gray-400">
          Este es un resumen de la información proporcionada. Revisá los datos antes de generar el documento.
        </p>
      </div>
    </div>
  );
}

