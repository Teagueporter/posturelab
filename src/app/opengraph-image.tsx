import { ImageResponse } from "next/og";

export const alt = "PostureLab posture scan and corrective exercise tracking";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f6f8f4",
          color: "#17211b",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: 64,
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 24,
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "#17211b",
              borderRadius: 28,
              display: "flex",
              height: 88,
              justifyContent: "center",
              position: "relative",
              width: 88,
            }}
          >
            <div
              style={{
                background: "#f6f8f4",
                borderRadius: 999,
                height: 18,
                position: "absolute",
                top: 18,
                width: 18,
              }}
            />
            <div
              style={{
                background: "#f6f8f4",
                borderRadius: 999,
                height: 46,
                position: "absolute",
                top: 42,
                width: 12,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ fontSize: 38, fontWeight: 800 }}>PostureLab</div>
            <div style={{ color: "#2f7d55", fontSize: 24, fontWeight: 700 }}>Photo-based posture tracking</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            maxWidth: 760,
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.02 }}>
            Scan posture. Track change. Follow a focused plan.
          </div>
          <div style={{ color: "#50645a", fontSize: 30, lineHeight: 1.35 }}>
            Guided upper-body photos, repeatable metrics, weekly progress, and corrective exercise plans.
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 18,
          }}
        >
          {["Scan", "Measure", "Plan", "Review"].map((label) => (
            <div
              key={label}
              style={{
                background: "#ffffff",
                border: "2px solid #dce5dc",
                borderRadius: 999,
                color: "#17211b",
                fontSize: 24,
                fontWeight: 800,
                padding: "12px 24px",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
