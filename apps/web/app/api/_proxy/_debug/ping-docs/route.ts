import { NextResponse } from "next/server";
import { apiUrl, generateJWT } from "../../utils";

export async function GET() {
  try {
    const jwt = await generateJWT();
    const url = apiUrl("/documents");
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${jwt}`, Accept: "application/json" },
    });
    const ct = r.headers.get("content-type") || "";
    let body: any = null;
    try {
      body = await r.json();
    } catch {
      body = (await r.text()).slice(0, 500);
    }
    return NextResponse.json({ ok: true, status: r.status, contentType: ct, body, url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || String(e) }, { status: 500 });
  }
}

