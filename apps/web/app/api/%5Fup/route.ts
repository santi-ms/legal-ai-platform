export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    message: "Frontend API layer working",
    when: new Date().toISOString(),
  });
}

