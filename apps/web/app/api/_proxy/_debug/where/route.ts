import { NextResponse } from "next/server";
import { backendPath, getApiBase } from "../../utils";

export async function GET() {
  const apiBase = getApiBase();
  const docsUrl = backendPath("documents");
  return NextResponse.json({ ok: true, apiBase, docsUrl });
}

