export const FREE_SCAN_LIMIT = 1;

export function hasReachedFreeScanLimit(input: {
  cloudScanCount?: number;
  isPro?: boolean;
  localScanCount?: number;
  paywallEnabled?: boolean;
}) {
  if (!input.paywallEnabled || input.isPro) return false;
  return Math.max(input.cloudScanCount ?? 0, input.localScanCount ?? 0) >= FREE_SCAN_LIMIT;
}
