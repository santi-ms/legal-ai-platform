/**
 * import-parser.ts
 * Parsea archivos Excel (.xlsx/.xls) y CSV para importación masiva.
 * Realiza fuzzy matching de columnas para tolerar diferentes nombres de headers.
 */

import * as XLSX from "xlsx";
import Papa from "papaparse";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ImportType = "clients" | "expedientes" | "honorarios";

export interface RawRow {
  [key: string]: string | number | null;
}

export interface ColumnMapping {
  [excelCol: string]: string; // excelCol → dbField
}

export interface ParsedRow {
  _row: number;
  [dbField: string]: any;
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  mapping: ColumnMapping;
  errors: ValidationError[];
  totalRows: number;
  validRows: number;
  duplicateCandidates: number;
}

// ─── Fuzzy column maps ────────────────────────────────────────────────────────

// Para cada dbField, lista de variantes de headers (lowercase, sin acentos)
const CLIENT_COLUMN_MAP: Record<string, string[]> = {
  name:           ["nombre", "nombre y apellido", "apellido y nombre", "razon social", "razón social", "empresa", "cliente", "name"],
  documentNumber: ["dni", "cuit", "cuil", "documento", "nro documento", "numero documento", "nro. documento", "doc", "id fiscal"],
  documentType:   ["tipo documento", "tipo doc", "tipo de documento", "document type"],
  email:          ["email", "mail", "correo", "e-mail", "correo electronico", "correo electrónico"],
  phone:          ["telefono", "teléfono", "tel", "celular", "movil", "móvil", "phone", "whatsapp"],
  address:        ["domicilio", "direccion", "dirección", "address", "calle"],
  city:           ["ciudad", "localidad", "city"],
  province:       ["provincia", "province"],
  notes:          ["notas", "observaciones", "notes", "comentarios"],
  type:           ["tipo", "tipo cliente", "persona", "type"],
};

const EXPEDIENTE_COLUMN_MAP: Record<string, string[]> = {
  title:         ["titulo", "título", "caratula", "carátula", "nombre", "descripcion", "descripción", "asunto", "title"],
  number:        ["numero", "número", "nro", "nro expediente", "numero expediente", "expediente", "causa", "file number"],
  matter:        ["materia", "fuero", "tipo", "rama", "matter"],
  status:        ["estado", "status", "situacion", "situación"],
  court:         ["juzgado", "tribunal", "fuero", "court"],
  judge:         ["juez", "magistrado", "judge"],
  opposingParty: ["parte contraria", "demandado", "actor", "contraparte", "opposing party"],
  openedAt:      ["fecha inicio", "inicio", "apertura", "fecha apertura", "opened", "fecha"],
  deadline:      ["vencimiento", "plazo", "deadline", "fecha vencimiento"],
  notes:         ["notas", "observaciones", "notes", "comentarios"],
};

const HONORARIO_COLUMN_MAP: Record<string, string[]> = {
  concepto:         ["concepto", "descripcion", "descripción", "detalle", "motivo", "concept"],
  tipo:             ["tipo", "type", "categoria", "categoría"],
  monto:            ["monto", "importe", "valor", "honorario", "amount", "precio"],
  moneda:           ["moneda", "currency", "divisa"],
  estado:           ["estado", "status", "situacion", "situación"],
  fechaEmision:     ["fecha emision", "fecha emisión", "emision", "emisión", "fecha", "date"],
  fechaVencimiento: ["vencimiento", "vence", "fecha vencimiento", "due date", "plazo"],
  notas:            ["notas", "observaciones", "comentarios", "notes"],
};

function getColumnMap(type: ImportType): Record<string, string[]> {
  if (type === "clients")      return CLIENT_COLUMN_MAP;
  if (type === "expedientes")  return EXPEDIENTE_COLUMN_MAP;
  return HONORARIO_COLUMN_MAP;
}

// ─── Normalización ────────────────────────────────────────────────────────────

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .trim();
}

function matchColumn(header: string, colMap: Record<string, string[]>): string | null {
  const normalized = normalizeHeader(header);
  for (const [dbField, variants] of Object.entries(colMap)) {
    if (variants.includes(normalized)) return dbField;
  }
  // partial match como fallback
  for (const [dbField, variants] of Object.entries(colMap)) {
    if (variants.some((v) => normalized.includes(v) || v.includes(normalized))) {
      return dbField;
    }
  }
  return null;
}

function buildMapping(headers: string[], type: ImportType): ColumnMapping {
  const colMap = getColumnMap(type);
  const mapping: ColumnMapping = {};
  for (const h of headers) {
    const dbField = matchColumn(h, colMap);
    if (dbField) mapping[h] = dbField;
  }
  return mapping;
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

export function parseBuffer(buffer: Buffer, filename: string): { headers: string[]; rows: RawRow[] } {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const text = buffer.toString("utf-8");
    const result = Papa.parse<RawRow>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });
    return {
      headers: result.meta.fields ?? [],
      rows: result.data,
    };
  }

  // xlsx / xls
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: null, raw: false });
  const headers = raw.length > 0 ? Object.keys(raw[0]) : [];
  return { headers, rows: raw };
}

// ─── Validación por tipo ──────────────────────────────────────────────────────

function validateClientRow(row: ParsedRow, idx: number): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!row.name || String(row.name).trim().length < 2) {
    errors.push({ row: idx, field: "name", value: row.name, message: "El nombre es requerido (mín. 2 caracteres)" });
  }
  if (row.email && !/^[^@]+@[^@]+\.[^@]+$/.test(String(row.email))) {
    errors.push({ row: idx, field: "email", value: row.email, message: "Email inválido" });
  }
  return errors;
}

function validateExpedienteRow(row: ParsedRow, idx: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const VALID_MATTERS = ["civil","penal","laboral","familia","comercial","administrativo","constitucional","tributario","otro"];
  if (!row.title || String(row.title).trim().length < 3) {
    errors.push({ row: idx, field: "title", value: row.title, message: "El título es requerido (mín. 3 caracteres)" });
  }
  if (row.matter && !VALID_MATTERS.includes(String(row.matter).toLowerCase())) {
    errors.push({ row: idx, field: "matter", value: row.matter, message: `Materia inválida. Válidas: ${VALID_MATTERS.join(", ")}` });
  }
  return errors;
}

function validateHonorarioRow(row: ParsedRow, idx: number): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!row.concepto || String(row.concepto).trim().length < 3) {
    errors.push({ row: idx, field: "concepto", value: row.concepto, message: "El concepto es requerido (mín. 3 caracteres)" });
  }
  const monto = parseFloat(String(row.monto ?? "").replace(",", ".").replace(/[^\d.]/g, ""));
  if (isNaN(monto) || monto <= 0) {
    errors.push({ row: idx, field: "monto", value: row.monto, message: "El monto debe ser un número positivo" });
  }
  return errors;
}

// ─── Coerciones de tipos ──────────────────────────────────────────────────────

function coerceMatter(v: any): string {
  const map: Record<string, string> = {
    civil: "civil", penal: "penal", laboral: "laboral", familia: "familia",
    comercial: "comercial", administrativo: "administrativo",
    constitucional: "constitucional", tributario: "tributario", otro: "otro",
  };
  return map[String(v ?? "").toLowerCase()] ?? "otro";
}

function coerceExpedienteStatus(v: any): string {
  const map: Record<string, string> = {
    activo: "activo", active: "activo",
    cerrado: "cerrado", closed: "cerrado",
    archivado: "archivado", archived: "archivado",
    suspendido: "suspendido", suspended: "suspendido",
  };
  return map[String(v ?? "").toLowerCase()] ?? "activo";
}

function coerceHonorarioTipo(v: any): string {
  const map: Record<string, string> = {
    consulta: "consulta", juicio: "juicio", acuerdo: "acuerdo",
    mediacion: "mediacion", mediación: "mediacion", otro: "otro",
  };
  return map[String(v ?? "").toLowerCase()] ?? "otro";
}

function coerceHonorarioEstado(v: any): string {
  const map: Record<string, string> = {
    presupuestado: "presupuestado", facturado: "facturado",
    cobrado: "cobrado", cancelado: "cancelado",
  };
  return map[String(v ?? "").toLowerCase()] ?? "presupuestado";
}

function coerceDate(v: any): string | null {
  if (!v) return null;
  // Si ya es un objeto Date (XLSX con cellDates)
  if (v instanceof Date) return v.toISOString();
  const s = String(v).trim();
  if (!s) return null;
  // Formatos comunes: DD/MM/YYYY, YYYY-MM-DD
  const ddmm = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmm) return new Date(`${ddmm[3]}-${ddmm[2].padStart(2,"0")}-${ddmm[1].padStart(2,"0")}T12:00:00Z`).toISOString();
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function coerceMoney(v: any): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, "");
  return parseFloat(s) || 0;
}

function normalizeClientType(v: any): string {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("juridica") || s.includes("jurídica") || s.includes("empresa") || s.includes("sociedad")) {
    return "persona_juridica";
  }
  return "persona_fisica";
}

// ─── Parser principal ─────────────────────────────────────────────────────────

export function parseImport(buffer: Buffer, filename: string, type: ImportType): ParseResult {
  const { headers, rows } = parseBuffer(buffer, filename);
  const mapping = buildMapping(headers, type);
  const errors: ValidationError[] = [];
  const parsed: ParsedRow[] = [];

  const MAX_ROWS = 1000;
  const limitedRows = rows.slice(0, MAX_ROWS);

  for (let i = 0; i < limitedRows.length; i++) {
    const raw = limitedRows[i];
    const rowNum = i + 2; // 1-indexed + header row

    // Aplicar mapping
    const mapped: ParsedRow = { _row: rowNum };
    for (const [excelCol, dbField] of Object.entries(mapping)) {
      mapped[dbField] = raw[excelCol] ?? null;
    }

    // Coerciones por tipo
    if (type === "clients") {
      if (mapped.type)    mapped.type    = normalizeClientType(mapped.type);
      else                mapped.type    = "persona_fisica";
      if (mapped.name)    mapped.name    = String(mapped.name).trim();
      if (mapped.email)   mapped.email   = String(mapped.email).trim().toLowerCase();
      if (mapped.phone)   mapped.phone   = String(mapped.phone ?? "").trim();
      if (mapped.address) mapped.address = String(mapped.address).trim();
    }

    if (type === "expedientes") {
      if (mapped.matter)   mapped.matter   = coerceMatter(mapped.matter);
      if (mapped.status)   mapped.status   = coerceExpedienteStatus(mapped.status);
      if (mapped.openedAt) mapped.openedAt = coerceDate(mapped.openedAt);
      if (mapped.deadline) mapped.deadline = coerceDate(mapped.deadline);
      if (mapped.title)    mapped.title    = String(mapped.title).trim();
      if (mapped.number)   mapped.number   = String(mapped.number ?? "").trim() || null;
    }

    if (type === "honorarios") {
      mapped.tipo   = coerceHonorarioTipo(mapped.tipo);
      mapped.estado = coerceHonorarioEstado(mapped.estado);
      mapped.monto  = coerceMoney(mapped.monto);
      if (mapped.fechaEmision)     mapped.fechaEmision     = coerceDate(mapped.fechaEmision);
      if (mapped.fechaVencimiento) mapped.fechaVencimiento = coerceDate(mapped.fechaVencimiento);
    }

    // Validar
    let rowErrors: ValidationError[] = [];
    if (type === "clients")      rowErrors = validateClientRow(mapped, rowNum);
    if (type === "expedientes")  rowErrors = validateExpedienteRow(mapped, rowNum);
    if (type === "honorarios")   rowErrors = validateHonorarioRow(mapped, rowNum);

    errors.push(...rowErrors);
    if (rowErrors.length === 0) parsed.push(mapped);
  }

  return {
    rows: parsed,
    mapping,
    errors,
    totalRows: limitedRows.length,
    validRows: parsed.length,
    duplicateCandidates: 0, // se calcula en la ruta con acceso a DB
  };
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function generateTemplate(type: ImportType): Buffer {
  const templates: Record<ImportType, object[]> = {
    clients: [
      {
        "Nombre / Razón Social": "Juan Pérez",
        "DNI / CUIT": "20-12345678-9",
        "Tipo (persona_fisica / persona_juridica)": "persona_fisica",
        "Email": "juan@email.com",
        "Teléfono": "3794-123456",
        "Domicilio": "San Martín 123",
        "Ciudad": "Posadas",
        "Provincia": "Misiones",
        "Notas": "",
      },
    ],
    expedientes: [
      {
        "Título / Carátula": "Pérez Juan c/ García Pedro s/ Daños y Perjuicios",
        "Número de Expediente": "CIV 1234/2025",
        "Materia (civil/penal/laboral/familia/comercial/administrativo/otro)": "civil",
        "Estado (activo/cerrado/archivado/suspendido)": "activo",
        "Juzgado": "Juzgado Civil y Comercial Nº 1",
        "Juez": "Dr. Roberto Sánchez",
        "Parte Contraria": "García Pedro",
        "Fecha Inicio (DD/MM/AAAA)": "01/03/2025",
        "Vencimiento (DD/MM/AAAA)": "",
        "Notas": "",
      },
    ],
    honorarios: [
      {
        "Concepto": "Honorarios por contestación de demanda",
        "Tipo (consulta/juicio/acuerdo/mediacion/otro)": "juicio",
        "Monto": "150000",
        "Moneda (ARS/USD)": "ARS",
        "Estado (presupuestado/facturado/cobrado/cancelado)": "facturado",
        "Fecha Emisión (DD/MM/AAAA)": "01/04/2026",
        "Fecha Vencimiento (DD/MM/AAAA)": "30/04/2026",
        "Notas": "",
      },
    ],
  };

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templates[type]);

  // Ajustar ancho de columnas
  const colWidths = Object.keys(templates[type][0]).map((k) => ({ wch: Math.max(k.length + 2, 20) }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Importar");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
