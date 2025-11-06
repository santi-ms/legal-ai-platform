import { NextResponse } from "next/server";
import { getSessionSafe } from "../../utils";

export async function GET() {
  const session = await getSessionSafe();
  return NextResponse.json({
    ok: true,
    session: {
      hasSession: !!session,
      email: session?.user?.email || null,
      id: (session?.user as any)?.id || null,
      tenantId: (session?.user as any)?.tenantId || null,
      role: (session?.user as any)?.role || null,
    },
  });
}

