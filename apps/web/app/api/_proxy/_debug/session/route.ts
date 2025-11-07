import { NextRequest, NextResponse } from "next/server";
import { getSessionSafe } from "../../utils";

export async function GET(_req: NextRequest) {
  const session: any = await getSessionSafe();
  const user = session?.user ?? null;

  return NextResponse.json({
    ok: true,
    session: {
      hasSession: !!user,
      email: user?.email || null,
      id: user?.id || null,
      tenantId: user?.tenantId || null,
      role: user?.role || null,
    },
  });
}

