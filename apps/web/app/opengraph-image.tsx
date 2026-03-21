import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LegalTech AR — Documentos Legales con IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 100px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            LT
          </div>
          <span style={{ color: "#a5b4fc", fontSize: 22, fontWeight: 600 }}>
            LegalTech AR
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            color: "white",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 24,
            maxWidth: 800,
          }}
        >
          Documentos Legales{" "}
          <span style={{ color: "#818cf8" }}>con Inteligencia Artificial</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: "#94a3b8",
            fontSize: 28,
            fontWeight: 400,
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Generá contratos, poderes y escrituras con validez jurídica en Argentina. Rápido, seguro y preciso.
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: 16, marginTop: 48 }}>
          {["Normativa Argentina", "Privacidad Garantizada", "Generación en minutos"].map(
            (badge) => (
              <div
                key={badge}
                style={{
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.4)",
                  borderRadius: 100,
                  padding: "10px 20px",
                  color: "#c7d2fe",
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
