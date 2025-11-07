import { NextResponse } from "next/server";
import { apiUrl, getApiBase } from "../../utils";

export async function GET() {
  const apiBase = getApiBase();
  const docsUrl = apiUrl("/documents");
  return NextResponse.json({ ok: true, apiBase, docsUrl });
}

