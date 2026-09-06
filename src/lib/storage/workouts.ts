"use client";

import { deleteWorkoutCompletionFromCloud, hydrateLocalWorkoutCompletionsFromCloud, syncWorkoutCompletionToCloud } from "@/lib/storage/cloud";

const KEY = "posturelab.workouts.v1";

export type WorkoutCompletion = {
  id: string;
  date: string;
  itemName: string;
  completedAt: string;
};

export function listWorkoutCompletions(): WorkoutCompletion[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WorkoutCompletion[];
  } catch {
    return [];
  }
}

export function isWorkoutComplete(itemName: string, date = todayKey()) {
  return listWorkoutCompletions().some((completion) => completion.itemName === itemName && completion.date === date);
}

export function setWorkoutComplete(itemName: string, complete: boolean, date = todayKey()) {
  const completions = listWorkoutCompletions();
  const remaining = completions.filter((completion) => !(completion.itemName === itemName && completion.date === date));
  if (!complete) {
    window.localStorage.setItem(KEY, JSON.stringify(remaining));
    void deleteWorkoutCompletionFromCloud(itemName, date);
    return remaining;
  }
  const next = [
    ...remaining,
    {
      id: crypto.randomUUID(),
      date,
      itemName,
      completedAt: new Date().toISOString(),
    },
  ];
  window.localStorage.setItem(KEY, JSON.stringify(next));
  void syncWorkoutCompletionToCloud(next[next.length - 1]);
  return next;
}

export function completionSummary(days = 14) {
  const completions = listWorkoutCompletions();
  const dates = lastNDates(days);
  return dates.map((date) => ({
    date,
    count: completions.filter((completion) => completion.date === date).length,
  }));
}

export async function hydrateWorkoutCompletionsFromCloud() {
  if (typeof window === "undefined") return [];
  const completions = await hydrateLocalWorkoutCompletionsFromCloud(listWorkoutCompletions());
  window.localStorage.setItem(KEY, JSON.stringify(completions));
  return completions;
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function lastNDates(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - index - 1));
    return date.toISOString().slice(0, 10);
  });
}
