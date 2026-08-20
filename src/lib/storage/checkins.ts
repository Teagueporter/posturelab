"use client";

const KEY = "posturelab.checkins.v1";

export type CheckIn = {
  id: string;
  date: string;
  discomfort: number;
  postureControl: number;
  energy: number;
  redFlags: boolean;
  notes: string;
  createdAt: string;
};

export type CheckInSummary = {
  count: number;
  latest?: CheckIn;
  averageDiscomfort?: number;
  averagePostureControl?: number;
  averageEnergy?: number;
  redFlagCount: number;
};

export function listCheckIns(): CheckIn[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CheckIn[];
  } catch {
    return [];
  }
}

export function getTodayCheckIn(date = todayKey()) {
  return listCheckIns().find((checkIn) => checkIn.date === date);
}

export function saveCheckIn(input: Omit<CheckIn, "id" | "createdAt"> & { id?: string }) {
  const existing = listCheckIns();
  const remaining = existing.filter((checkIn) => checkIn.date !== input.date);
  const next: CheckIn = {
    id: input.id ?? crypto.randomUUID(),
    date: input.date,
    discomfort: clamp(input.discomfort),
    postureControl: clamp(input.postureControl),
    energy: clamp(input.energy),
    redFlags: input.redFlags,
    notes: input.notes.trim(),
    createdAt: new Date().toISOString(),
  };
  const checkIns = [next, ...remaining].sort((a, b) => b.date.localeCompare(a.date));
  window.localStorage.setItem(KEY, JSON.stringify(checkIns));
  return next;
}

export function summarizeCheckIns(checkIns: CheckIn[]): CheckInSummary {
  if (!checkIns.length) {
    return { count: 0, redFlagCount: 0 };
  }
  return {
    count: checkIns.length,
    latest: checkIns[0],
    averageDiscomfort: average(checkIns.map((checkIn) => checkIn.discomfort)),
    averagePostureControl: average(checkIns.map((checkIn) => checkIn.postureControl)),
    averageEnergy: average(checkIns.map((checkIn) => checkIn.energy)),
    redFlagCount: checkIns.filter((checkIn) => checkIn.redFlags).length,
  };
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function average(values: number[]) {
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function clamp(value: number) {
  return Math.max(0, Math.min(10, Math.round(value)));
}
