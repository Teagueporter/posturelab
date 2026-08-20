import { LANDMARK_NAMES, POSE } from "@/lib/pose/landmarks";
import type { Measurement } from "@/lib/measurements/types";
import type { PoseResult } from "@/lib/pose/types";

const connections = [
  [POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER],
  [POSE.LEFT_HIP, POSE.RIGHT_HIP],
  [POSE.LEFT_SHOULDER, POSE.LEFT_HIP],
  [POSE.RIGHT_SHOULDER, POSE.RIGHT_HIP],
  [POSE.LEFT_EAR, POSE.LEFT_SHOULDER],
  [POSE.RIGHT_EAR, POSE.RIGHT_SHOULDER],
];

export function PoseOverlay({ pose, measurements, image }: { pose?: PoseResult; measurements?: Measurement[]; image?: string }) {
  const landmarks = pose?.landmarks;
  const shoulderMid = midpoint(landmarks?.[POSE.LEFT_SHOULDER], landmarks?.[POSE.RIGHT_SHOULDER]);
  const hipMid = midpoint(landmarks?.[POSE.LEFT_HIP], landmarks?.[POSE.RIGHT_HIP]);
  const earMid = midpoint(landmarks?.[POSE.LEFT_EAR], landmarks?.[POSE.RIGHT_EAR]);
  const shoulderTilt = measurements?.find((measurement) => measurement.id.includes("shoulder_tilt"));
  const hipTilt = measurements?.find((measurement) => measurement.id.includes("hip_tilt"));
  const headOffset = measurements?.find((measurement) => measurement.id.includes("ear_over_shoulder") || measurement.id.includes("head_lateral_offset"));
  const trunkLean = measurements?.find((measurement) => measurement.id.includes("trunk_lean") || measurement.id.includes("shoulder_over_hip"));

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-[#d8ded7] bg-[#eef2ee]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm text-[#667568]">Pose overlay</div>
      )}
      <svg viewBox="0 0 1 1" className="absolute inset-0 h-full w-full">
        {shoulderMid && <line x1={shoulderMid.x} y1="0.08" x2={shoulderMid.x} y2="0.92" stroke="#ffffff" strokeOpacity="0.7" strokeDasharray="0.018 0.016" strokeWidth="0.004" />}
        {hipMid && <line x1={hipMid.x} y1="0.08" x2={hipMid.x} y2="0.92" stroke="#17211b" strokeOpacity="0.55" strokeDasharray="0.014 0.014" strokeWidth="0.004" />}
        {earMid && shoulderMid && (
          <>
            <line x1={earMid.x} y1={earMid.y} x2={shoulderMid.x} y2={earMid.y} stroke="#f0b84f" strokeWidth="0.006" />
            <line x1={shoulderMid.x} y1={earMid.y} x2={shoulderMid.x} y2={shoulderMid.y} stroke="#f0b84f" strokeOpacity="0.55" strokeDasharray="0.012 0.012" strokeWidth="0.004" />
          </>
        )}
        {shoulderMid && hipMid && <line x1={shoulderMid.x} y1={shoulderMid.y} x2={hipMid.x} y2={hipMid.y} stroke="#6f58c9" strokeWidth="0.007" />}
        {connections.map(([a, b]) =>
          pose?.landmarks[a] && pose.landmarks[b] ? (
            <line key={`${a}-${b}`} x1={pose.landmarks[a].x} y1={pose.landmarks[a].y} x2={pose.landmarks[b].x} y2={pose.landmarks[b].y} stroke="#237a57" strokeWidth="0.008" />
          ) : null,
        )}
        {pose?.landmarks.map((landmark, index) =>
          LANDMARK_NAMES[index] ? (
            <circle key={index} cx={landmark.x} cy={landmark.y} r="0.012" fill="#c5573d">
              <title>{LANDMARK_NAMES[index]}</title>
            </circle>
          ) : null,
        )}
        {measurements?.some((m) => m.id.includes("tilt")) && <line x1="0.08" y1="0.32" x2="0.92" y2="0.32" stroke="#17211b" strokeDasharray="0.02 0.02" strokeWidth="0.004" />}
        {shoulderTilt && <Label x={0.06} y={0.28} text={`Shoulders ${shoulderTilt.value}${shoulderTilt.unit}`} />}
        {hipTilt && <Label x={0.06} y={0.61} text={`Hips ${hipTilt.value}${hipTilt.unit}`} />}
        {headOffset && <Label x={0.5} y={0.13} text={`Head offset ${headOffset.value}${headOffset.unit}`} />}
        {trunkLean && <Label x={0.5} y={0.82} text={`Trunk ${trunkLean.value}${trunkLean.unit}`} />}
      </svg>
      <div className="absolute bottom-2 left-2 right-2 grid gap-1 text-[10px] font-medium text-white">
        {measurements?.slice(0, 3).map((measurement) => (
          <div key={measurement.id} className="rounded-sm bg-[#101712]/75 px-2 py-1">
            {measurement.label}: {measurement.value}{measurement.unit}
          </div>
        ))}
      </div>
    </div>
  );
}

function Label({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <rect x={x - 0.005} y={y - 0.027} width={Math.min(0.42, 0.018 + text.length * 0.011)} height="0.04" rx="0.008" fill="#101712" fillOpacity="0.78" />
      <text x={x + 0.008} y={y} fill="#ffffff" fontSize="0.024" fontWeight="600">{text}</text>
    </g>
  );
}

function midpoint(a?: { x: number; y: number }, b?: { x: number; y: number }) {
  if (!a || !b) return undefined;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
