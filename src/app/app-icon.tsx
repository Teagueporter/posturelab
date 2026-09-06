import { ImageResponse } from "next/og";

type IconSize = {
  width: number;
  height: number;
};

export const iconContentType = "image/png";

export function createAppIcon(size: IconSize) {
  const scale = size.width / 512;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#17211b",
          color: "#f6f8f4",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            border: `${22 * scale}px solid #f6f8f4`,
            borderRadius: 96 * scale,
            display: "flex",
            height: 308 * scale,
            justifyContent: "center",
            position: "relative",
            width: 308 * scale,
          }}
        >
          <div
            style={{
              background: "#f6f8f4",
              borderRadius: 999,
              height: 54 * scale,
              left: 127 * scale,
              position: "absolute",
              top: 54 * scale,
              width: 54 * scale,
            }}
          />
          <div
            style={{
              background: "#f6f8f4",
              borderRadius: 22 * scale,
              height: 146 * scale,
              left: 143 * scale,
              position: "absolute",
              top: 116 * scale,
              width: 22 * scale,
            }}
          />
          <div
            style={{
              background: "#f6f8f4",
              borderRadius: 22 * scale,
              height: 24 * scale,
              left: 84 * scale,
              position: "absolute",
              top: 150 * scale,
              width: 140 * scale,
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
