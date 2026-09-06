"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, FlaskConical, Lock, RotateCcw, Wand2 } from "lucide-react";
import { analyzeScan } from "@/lib/measurements/analyze";
import { hasReachedFreeScanLimit } from "@/lib/billing/entitlements";
import type { PoseResult } from "@/lib/pose/types";
import { createMediaPipePoseDetector } from "@/lib/pose/mediapipe";
import { POSE } from "@/lib/pose/landmarks";
import { assessViewQuality } from "@/lib/pose/scan-quality";
import { scanSetupProtocol } from "@/lib/pose/setup-protocol";
import { hasRequiredLandmarks } from "@/lib/pose/quality";
import { listScans, saveScan } from "@/lib/storage/scans";
import { PoseOverlay } from "@/components/pose/PoseOverlay";
import { Card } from "@/components/ui/card";

type CaptureStep = "front" | "leftSide" | "rightSide" | "back";
type Step = "intro" | CaptureStep | "analyzing";

const captureSteps: CaptureStep[] = ["front", "leftSide", "rightSide", "back"];
const CAPTURE_DELAY_SECONDS = 5;

const copy: Record<CaptureStep, { label: string; title: string; instructions: string; use: string }> = {
  front: {
    label: "FRONT PHOTO",
    title: "Capture front view",
    instructions: "Face the camera. Frame head through hips, arms relaxed, camera level.",
    use: "Use front",
  },
  leftSide: {
    label: "LEFT SIDE PHOTO",
    title: "Capture left side",
    instructions: "Turn left side to the camera. Stand naturally and avoid rotating toward the camera.",
    use: "Use left side",
  },
  rightSide: {
    label: "RIGHT SIDE PHOTO",
    title: "Capture right side",
    instructions: "Turn right side to the camera. Stand naturally and avoid rotating toward the camera.",
    use: "Use right side",
  },
  back: {
    label: "BACK PHOTO",
    title: "Capture back view",
    instructions: "Face away from the camera. Keep head, shoulders, and hips visible.",
    use: "Use back",
  },
};

export function ScanWizard({
  cloudScanCount = 0,
  isPro = false,
  paywallEnabled = false,
}: {
  cloudScanCount?: number;
  isPro?: boolean;
  paywallEnabled?: boolean;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const [step, setStep] = useState<Step>("intro");
  const [images, setImages] = useState<Partial<Record<CaptureStep, string>>>({});
  const [poses, setPoses] = useState<Partial<Record<CaptureStep, PoseResult>>>({});
  const [message, setMessage] = useState("Camera starts when you begin.");
  const [cameraDenied, setCameraDenied] = useState(false);
  const [countdown, setCountdown] = useState<number>();

  const currentStep = step === "analyzing" || step === "intro" ? undefined : step;
  const currentIndex = currentStep ? captureSteps.indexOf(currentStep) : -1;
  const canAnalyze = captureSteps.every((item) => images[item] && poses[item]);

  async function startCamera(next: CaptureStep) {
    if (scanLimitReached()) {
      setMessage("Free accounts include one saved scan. Upgrade to Pro for unlimited scan history and weekly progress reviews.");
      return;
    }
    cancelCountdown();
    stopCamera();
    setStep(next);
    setMessage(copy[next].instructions);
    setCameraDenied(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError");
      setCameraDenied(denied);
      setMessage(
        denied
          ? "Camera permission was denied. Allow camera access in the browser, or use sample landmarks to continue testing the flow."
          : "Camera could not start. You can use sample landmarks to continue testing the flow.",
      );
    }
  }

  async function capture() {
    if (!currentStep) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.srcObject) {
      setMessage("Camera is not active. Allow camera access or use sample landmarks.");
      return;
    }
    canvas.width = video.videoWidth || 900;
    canvas.height = video.videoHeight || 1200;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg", 0.9);
    await detectAndStore(currentStep, image, canvas);
  }

  function startDelayedCapture() {
    if (!currentStep) return;
    if (!videoRef.current?.srcObject) {
      setMessage("Camera is not active. Allow camera access or use sample landmarks.");
      return;
    }
    cancelCountdown();
    setCountdown(CAPTURE_DELAY_SECONDS);
    setMessage("5 second timer started. Step into position and stand naturally.");
    timerRef.current = window.setInterval(() => {
      setCountdown((current) => {
        if (!current || current <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = undefined;
          void capture();
          return undefined;
        }
        return current - 1;
      });
    }, 1000);
  }

  async function useSample() {
    if (!currentStep) return;
    cancelCountdown();
    const pose = samplePose(currentStep === "front" || currentStep === "back" ? "front" : "side");
    setImages((previous) => ({ ...previous, [currentStep]: undefined }));
    setPoses((previous) => ({ ...previous, [currentStep]: pose }));
    setMessage(`${copy[currentStep].label} sample landmarks loaded. Use this view or retake it.`);
  }

  async function detectAndStore(current: CaptureStep, image: string, canvas: HTMLCanvasElement) {
    setMessage("Running landmark detection...");
    let pose: PoseResult;
    try {
      const detector = await createMediaPipePoseDetector("full");
      pose = await detector.detect(canvas);
    } catch {
      pose = samplePose(current === "front" || current === "back" ? "front" : "side");
      setMessage("MediaPipe was unavailable, so sample landmarks were used for local MVP review.");
    }
    const required = [POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER, POSE.LEFT_HIP, POSE.RIGHT_HIP, POSE.LEFT_EAR, POSE.RIGHT_EAR];
    if (!hasRequiredLandmarks(pose.landmarks, required)) {
      setMessage("We could not confidently see the head, shoulders, and hips. Try another photo.");
      return;
    }
    const viewQuality = assessViewQuality(current, pose);
    setImages((previous) => ({ ...previous, [current]: image }));
    setPoses((previous) => ({ ...previous, [current]: pose }));
    setMessage(
      viewQuality.requiredVisible && viewQuality.cropWarnings.length === 0
        ? `${copy[current].label} landmarks detected. Upper-body quality: ${viewQuality.quality}.`
        : `${copy[current].label} detected, but trend quality is ${viewQuality.quality}. ${viewQuality.notes[0] ?? "Retake for clearer head, shoulder, and hip landmarks."}`,
    );
  }

  function continueFlow() {
    if (!currentStep) return;
    const next = captureSteps[currentIndex + 1];
    if (next) {
      void startCamera(next);
      return;
    }
    analyze();
  }

  function analyze() {
    cancelCountdown();
    const front = poses.front;
    const leftSide = poses.leftSide;
    const rightSide = poses.rightSide;
    const back = poses.back;
    if (!front || !leftSide || !rightSide || !back) return;
    stopCamera();
    setStep("analyzing");
    const scan = analyzeScan({
      front,
      leftSide,
      rightSide,
      back,
      frontImage: images.front,
      leftSideImage: images.leftSide,
      rightSideImage: images.rightSide,
      backImage: images.back,
    });
    if (scanLimitReached()) {
      setMessage("Free accounts include one saved scan. Upgrade to Pro before saving another scan.");
      setStep("intro");
      return;
    }
    saveScan(scan);
    router.push(`/results/${scan.id}`);
  }

  function scanLimitReached() {
    return hasReachedFreeScanLimit({
      cloudScanCount,
      isPro,
      localScanCount: listScans().length,
      paywallEnabled,
    });
  }

  function retake() {
    if (!currentStep) return;
    cancelCountdown();
    setImages((previous) => ({ ...previous, [currentStep]: undefined }));
    setPoses((previous) => ({ ...previous, [currentStep]: undefined }));
    void startCamera(currentStep);
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function cancelCountdown() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = undefined;
    setCountdown(undefined);
  }

  const preview = useMemo(
    () => currentStep ? { image: images[currentStep], pose: poses[currentStep] } : {},
    [currentStep, images, poses],
  );

  if (step === "intro") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-8 sm:justify-center">
        <h1 className="text-4xl font-semibold leading-tight">POSTURE SCAN</h1>
        <p className="mt-4 max-w-prose text-base leading-7 text-[#516156]">You will take four upper-body photos: front, left side, right side, and back.</p>
        <div className="mt-5 rounded-md border border-[#d8ded7] bg-white p-4 text-sm leading-6 text-[#516156]">
          <p>
            Photos stay on this device unless you sign in and cloud sync is configured. Signed-in scans are stored privately for history,
            exports, and progress reviews, and you can delete cloud data from Account.
          </p>
          <Link className="mt-2 inline-flex font-semibold text-[#237a57]" href="/privacy">
            Privacy details
          </Link>
        </div>
        {scanLimitReached() ? (
          <div className="mt-5 rounded-md border border-[#efd1c8] bg-[#fff8f5] p-4 text-sm leading-6 text-[#7c2d1f]">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="h-4 w-4" />
              Free scan limit reached
            </div>
            <p className="mt-1">Upgrade to Pro for unlimited scans, weekly progress reviews, and full plan history.</p>
            <Link className="mt-3 inline-flex h-10 items-center rounded-md bg-[#17211b] px-3 text-sm font-semibold text-white" href="/pricing">
              View pricing
            </Link>
          </div>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {scanSetupProtocol.slice(0, 5).map((item) => (
            <Card key={item.title} className="p-3">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#237a57]" />
                <div>
                  <h2 className="text-sm font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-5 text-[#516156]">{item.detail}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <button className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#17211b] px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={() => startCamera("front")} disabled={scanLimitReached()}>
          <Camera className="h-4 w-4" /> Begin Scan
        </button>
      </div>
    );
  }

  if (!currentStep) {
    return <div className="grid min-h-dvh place-items-center text-sm text-[#516156]">Analyzing scan...</div>;
  }

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#237a57]">{copy[currentStep].label}</p>
          <h1 className="text-2xl font-semibold">{copy[currentStep].title}</h1>
        </div>
        <a href="/lab" className="rounded-md border border-[#d8ded7] p-2" title="Research mode"><FlaskConical className="h-4 w-4" /></a>
      </div>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {captureSteps.map((item, index) => (
          <div key={item} className={`h-2 rounded-full ${index <= currentIndex ? "bg-[#237a57]" : "bg-[#d8ded7]"}`} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          {cameraDenied && <div className="absolute inset-0 grid place-items-center bg-[#101712] p-6 text-center text-sm text-white">Camera permission denied</div>}
          {countdown && (
            <div className="absolute inset-0 grid place-items-center bg-black/35 text-white">
              <div className="grid h-28 w-28 place-items-center rounded-full border-2 border-white bg-black/45 text-6xl font-semibold">
                {countdown}
              </div>
            </div>
          )}
          <div className="absolute inset-x-[20%] top-[7%] bottom-[18%] rounded-[45%] border border-white/75" />
          <div className="absolute inset-x-8 top-[14%] border-t border-white/50" />
          <div className="absolute inset-x-8 top-[38%] border-t border-dashed border-white/65" />
          <div className="absolute inset-x-8 top-[64%] border-t border-dashed border-white/65" />
          <div className="absolute bottom-3 left-3 rounded-sm bg-black/55 px-2 py-1 text-xs font-medium text-white">Head to hips</div>
        </div>
        <PoseOverlay image={preview.image} pose={preview.pose} />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <p className="mt-4 rounded-md border border-[#d8ded7] bg-white p-3 text-sm text-[#516156]">{message}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button className="h-12 rounded-md border border-[#cfd8d1] font-semibold" onClick={startDelayedCapture} disabled={Boolean(countdown)}>
          {countdown ? "Timer running" : "Start 5s timer"}
        </button>
        <button disabled={!poses[currentStep]} className="h-12 rounded-md bg-[#17211b] font-semibold text-white disabled:opacity-40" onClick={continueFlow}>
          {currentStep === "back" ? "Analyze" : copy[currentStep].use}
        </button>
        <button className="inline-flex h-10 items-center justify-center gap-2 text-sm text-[#516156]" onClick={countdown ? cancelCountdown : retake}>
          <RotateCcw className="h-4 w-4" /> {countdown ? "Cancel timer" : "Retake"}
        </button>
        <button className="inline-flex h-10 items-center justify-center gap-2 text-sm text-[#516156]" onClick={useSample}>
          <Wand2 className="h-4 w-4" /> Use sample
        </button>
      </div>
      {canAnalyze && currentStep !== "back" && (
        <button className="mt-3 h-11 w-full rounded-md border border-[#cfd8d1] text-sm font-semibold" onClick={analyze}>Analyze completed scan</button>
      )}
    </div>
  );
}

function samplePose(view: "front" | "side"): PoseResult {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.95, presence: 0.95 }));
  if (view === "front") {
    landmarks[POSE.LEFT_EYE] = { x: 0.43, y: 0.18, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_EYE] = { x: 0.57, y: 0.185, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.LEFT_EAR] = { x: 0.38, y: 0.2, visibility: 0.9, presence: 0.9 };
    landmarks[POSE.RIGHT_EAR] = { x: 0.62, y: 0.205, visibility: 0.9, presence: 0.9 };
    landmarks[POSE.LEFT_SHOULDER] = { x: 0.34, y: 0.34, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_SHOULDER] = { x: 0.66, y: 0.352, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.LEFT_HIP] = { x: 0.39, y: 0.64, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_HIP] = { x: 0.62, y: 0.645, visibility: 0.95, presence: 0.95 };
  } else {
    landmarks[POSE.LEFT_EAR] = { x: 0.55, y: 0.19, visibility: 0.9, presence: 0.9 };
    landmarks[POSE.RIGHT_EAR] = { x: 0.56, y: 0.19, visibility: 0.9, presence: 0.9 };
    landmarks[POSE.LEFT_SHOULDER] = { x: 0.5, y: 0.34, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_SHOULDER] = { x: 0.51, y: 0.34, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.LEFT_HIP] = { x: 0.49, y: 0.63, visibility: 0.95, presence: 0.95 };
    landmarks[POSE.RIGHT_HIP] = { x: 0.5, y: 0.63, visibility: 0.95, presence: 0.95 };
  }
  return { landmarks };
}
