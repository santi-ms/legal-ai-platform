/**
 * Lease Clause: Obligaciones Especiales del Locatario
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseObligationsClause: ClauseDefinition = {
  id: "obligaciones_especiales_locacion",
  name: "Obligaciones Especiales del Locatario",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: OBLIGACIONES ESPECIALES DEL LOCATARIO

{{USUARIOS_INMUEBLE}}

El LOCATARIO se obliga a permitir al LOCADOR o a quien éste designe, la inspección del inmueble con un preaviso mínimo de cuarenta y ocho (48) horas hábiles, sin que ello implique interferencia en el uso pacífico del inmueble.

Se prohíbe expresamente la instalación de lavarropas o equipos similares en los dormitorios del inmueble, así como la instalación de equipos de aire acondicionado de ventana o pared que requieran perforaciones o modificaciones estructurales, sin previa autorización escrita del LOCADOR.

Queda expresamente prohibido mantener en el inmueble locado cualquier tipo de animal doméstico o mascota, sin excepción alguna, salvo autorización expresa y escrita del LOCADOR.

Los riesgos y daños causados por incendio, explosión, inundación u otros siniestros que sean atribuibles al uso negligente o indebido del inmueble por parte del LOCATARIO serán a exclusivo cargo de este último, debiendo indemnizar al LOCADOR por los daños ocasionados.

Todos los actos, notificaciones y comunicaciones entre las partes vinculados al presente contrato deberán realizarse exclusivamente por escrito para tener validez legal.`,
};
