import { describe, it, expect } from "vitest";
import { sanitizeInput, sanitizeObject, sanitizeArray } from "./sanitize.js";

describe("sanitizeInput", () => {
  it("retorna string vacío si el input es vacío", () => {
    expect(sanitizeInput("")).toBe("");
  });

  it("retorna string vacío si el input no es un string", () => {
    expect(sanitizeInput(null as any)).toBe("");
    expect(sanitizeInput(undefined as any)).toBe("");
    expect(sanitizeInput(123 as any)).toBe("");
  });

  it("elimina tags HTML peligrosos por defecto", () => {
    expect(sanitizeInput("<script>alert('xss')</script>")).toBe("");
    expect(sanitizeInput('<img src=x onerror="alert(1)">')).toBe("");
  });

  it("elimina tags HTML comunes en modo estricto (default)", () => {
    expect(sanitizeInput("<b>texto</b>")).toBe("texto");
    expect(sanitizeInput("<p>párrafo</p>")).toBe("párrafo");
  });

  it("preserva texto plano sin cambios", () => {
    const texto = "Juan Pérez, CUIT 20-12345678-9, domicilio en Corrientes 1234";
    expect(sanitizeInput(texto)).toBe(texto);
  });

  it("permite HTML seguro cuando allowHtml=true", () => {
    const input = "<b>negrita</b> y <i>cursiva</i>";
    const result = sanitizeInput(input, true);
    expect(result).toContain("<b>negrita</b>");
    expect(result).toContain("<i>cursiva</i>");
  });

  it("elimina scripts aunque allowHtml=true", () => {
    const result = sanitizeInput('<script>evil()</script><b>ok</b>', true);
    expect(result).not.toContain("<script>");
    expect(result).toContain("<b>ok</b>");
  });

  it("elimina atributos onclick y onerror aunque allowHtml=true", () => {
    const result = sanitizeInput('<a href="/ok" onclick="evil()">link</a>', true);
    expect(result).not.toContain("onclick");
    expect(result).toContain("href");
  });
});

describe("sanitizeObject", () => {
  it("sanitiza strings en las propiedades del objeto", () => {
    const obj = {
      nombre: '<script>alert(1)</script>Juan',
      edad: 30,
      activo: true,
    };
    const result = sanitizeObject(obj);
    expect(result.nombre).toBe("Juan");
    expect(result.edad).toBe(30);
    expect(result.activo).toBe(true);
  });

  it("sanitiza objetos anidados recursivamente", () => {
    const obj = {
      persona: {
        nombre: '<b>Pedro</b>',
        email: 'pedro@example.com',
      },
    };
    const result = sanitizeObject(obj);
    expect(result.persona.nombre).toBe("Pedro");
    expect(result.persona.email).toBe("pedro@example.com");
  });

  it("retorna el mismo objeto si no es un objeto válido", () => {
    expect(sanitizeObject(null as any)).toBeNull();
  });

  it("no muta el objeto original", () => {
    const obj = { nombre: "<script>x</script>Juan" };
    sanitizeObject(obj);
    expect(obj.nombre).toBe("<script>x</script>Juan");
  });
});

describe("sanitizeArray", () => {
  it("sanitiza cada elemento del array", () => {
    const arr = ["<script>evil()</script>", "texto normal", "<b>bold</b>"];
    const result = sanitizeArray(arr);
    expect(result[0]).toBe("");
    expect(result[1]).toBe("texto normal");
    expect(result[2]).toBe("bold");
  });

  it("retorna array vacío si el input no es un array", () => {
    expect(sanitizeArray(null as any)).toEqual([]);
    expect(sanitizeArray("string" as any)).toEqual([]);
  });

  it("convierte elementos no-string a string", () => {
    const result = sanitizeArray([123, true, null] as any);
    expect(result).toEqual(["123", "true", "null"]);
  });
});
