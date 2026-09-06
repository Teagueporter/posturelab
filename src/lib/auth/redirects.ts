export function safeNextPath(value: FormDataEntryValue | string | null | undefined, fallback = "/account") {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, "http://posturelab.local");
    if (parsed.origin !== "http://posturelab.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
