"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Camera, Check, ChevronDown, ExternalLink, FileText, History, Link as LinkIcon, Lock, Ruler, Target } from "lucide-react";
import { buildBodyFindings, evidenceTakeaways, severityLabel, type BodyFinding, type BodyFindingSeverity } from "@/lib/interpretation/body-findings";
import { decisionRules, evidenceNotes, protocolPhases, routine, type ExerciseLevel, type RoutineItem } from "@/lib/interpretation/rules";
import { baselineMeasurement, latestMeasurement, measurementDelta, measurementTargets, measurementTrends, type MeasurementTrend } from "@/lib/interpretation/progress";
import { buildWeeklyProgressReview, weeklyReviewStartKey } from "@/lib/interpretation/scan-summary";
import type { ScanAnalysis } from "@/lib/measurements/types";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hydrateCheckInsFromCloud, getTodayCheckIn, listCheckIns, saveCheckIn, summarizeCheckIns, todayKey, type CheckIn } from "@/lib/storage/checkins";
import { hydrateScansFromCloud, listScans } from "@/lib/storage/scans";
import { hydrateWorkoutCompletionsFromCloud, completionSummary, isWorkoutComplete, listWorkoutCompletions, setWorkoutComplete, type WorkoutCompletion } from "@/lib/storage/workouts";
import { syncWeeklyReviewToCloud } from "@/lib/storage/cloud";

type CheckInDraft = Omit<CheckIn, "id" | "createdAt"> & { id?: string };

const starterExerciseNames = [
  "Chin tuck / deep neck flexor hold",
  "Thoracic extension mobility",
  "Band row or cable row",
  "Pec doorway stretch",
];

const exerciseReferenceLinks: Record<string, { label: string; url: string }> = {
  "Chin tuck / deep neck flexor hold": {
    label: "Spine-health chin tuck guide",
    url: "https://www.spine-health.com/wellness/exercise/easy-chin-tucks-neck-pain",
  },
  "Thoracic extension mobility": {
    label: "Thoracic extension demo",
    url: "https://www.muscleandstrength.com/exercises/thoracic-extension-on-foam-roller",
  },
  "Band row or cable row": {
    label: "ACE seated row guide",
    url: "https://www.acefitness.org/resources/everyone/exercise-library/48/seated-row/",
  },
  "Prone Y/T/W raises": {
    label: "Y/T/W demo",
    url: "https://elite-performance-institute.com/exercise-library/shoulder-exercises/ytw-exercise/",
  },
  "Pec doorway stretch": {
    label: "Doorway stretch demo",
    url: "https://www.kovofitness.com/exercises/doorway-chest-stretch",
  },
  "Hip hinge + split squat pattern": {
    label: "ACE hip hinge guide",
    url: "https://www.acefitness.org/resources/everyone/exercise-library/33/hip-hinge/",
  },
};

export function PlanView({ isPro = false, paywallEnabled = false }: { isPro?: boolean; paywallEnabled?: boolean }) {
  const [scans, setScans] = useState<ScanAnalysis[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [checkInForm, setCheckInForm] = useState<CheckInDraft>(() => todayCheckInDraft());
  const [completions, setCompletions] = useState(() => completionSummary(14));
  const [workoutCompletions, setWorkoutCompletions] = useState<WorkoutCompletion[]>([]);
  const [completedToday, setCompletedToday] = useState(() => new Set(routine.filter((item) => isWorkoutComplete(item.name)).map((item) => item.name)));
  const [clientDataReady, setClientDataReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setScans(listScans());
      setCheckIns(listCheckIns());
      setCheckInForm(todayCheckInDraft());
      setWorkoutCompletions(listWorkoutCompletions());
      setCompletions(completionSummary(14));
      setCompletedToday(new Set(routine.filter((item) => isWorkoutComplete(item.name)).map((item) => item.name)));
      setClientDataReady(true);
      void hydrateScansFromCloud().then(setScans);
      void hydrateCheckInsFromCloud().then((cloudCheckIns) => {
        setCheckIns(cloudCheckIns);
        setCheckInForm(todayCheckInDraft());
      });
      void hydrateWorkoutCompletionsFromCloud().then((cloudCompletions) => {
        setWorkoutCompletions(cloudCompletions);
        setCompletions(completionSummary(14));
        setCompletedToday(new Set(routine.filter((item) => isWorkoutComplete(item.name)).map((item) => item.name)));
      });
    });
  }, []);

  function toggle(itemName: string) {
    setWorkoutComplete(itemName, !isWorkoutComplete(itemName));
    setWorkoutCompletions(listWorkoutCompletions());
    setCompletions(completionSummary(14));
    setCompletedToday(new Set(routine.filter((item) => isWorkoutComplete(item.name)).map((item) => item.name)));
  }

  function saveTodayCheckIn() {
    saveCheckIn(checkInForm);
    setCheckIns(listCheckIns());
  }

  const latestScan = scans[0];
  const findings = useMemo(() => latestScan ? buildBodyFindings(latestScan).sort((a, b) => b.score - a.score) : [], [latestScan]);
  const planExercises = useMemo(
    () => recommendedExercises(findings, checkInForm, workoutCompletions),
    [findings, checkInForm, workoutCompletions],
  );
  const checkInSummary = summarizeCheckIns(checkIns);
  const weeklyReview = useMemo(
    () => buildWeeklyProgressReview({
      scans,
      checkIns,
      completions: workoutCompletions,
      routineCount: Math.max(1, planExercises.length),
    }),
    [scans, checkIns, workoutCompletions, planExercises.length],
  );
  const weekStart = weeklyReviewStartKey();
  const trends = measurementTrends(scans);

  useEffect(() => {
    if (!isPro || !clientDataReady) return;
    void syncWeeklyReviewToCloud(weekStart, weeklyReview);
  }, [clientDataReady, isPro, weekStart, weeklyReview]);

  return (
    <main className="mx-auto min-h-dvh max-w-6xl overflow-hidden px-5 py-6">
      <Header />
      <PlanSummary latestScan={latestScan} findings={findings} exerciseCount={planExercises.length} />
      {paywallEnabled && !isPro ? <WeeklyReviewUpgrade /> : <WeeklyReview summary={weeklyReview} />}
      <TodayRoutine exercises={planExercises} completedToday={completedToday} onToggle={toggle} />
      <DailyCheckIn
        checkInForm={checkInForm}
        checkInSummary={checkInSummary}
        onChange={setCheckInForm}
        onSave={saveTodayCheckIn}
      />
      <ExerciseGuides exercises={planExercises} completedToday={completedToday} onToggle={toggle} />
      <ProgressAndEvidence scans={scans} trends={trends} completions={completions} routineCount={planExercises.length} />
    </main>
  );
}

function WeeklyReviewUpgrade() {
  return (
    <Card className="mt-5 border-[#efd1c8] bg-[#fff8f5]">
      <CardContent>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#9d3b2b]">
              <Lock className="h-4 w-4" />
              Pro weekly review
            </p>
            <h2 className="mt-1 text-xl font-semibold">Unlock progress reviews after repeat scans.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c514b]">
              Pro compares scan trends, check-ins, and workout adherence so the plan changes based on what is actually improving.
            </p>
          </div>
          <ButtonLink href="/pricing" variant="primary">View pricing</ButtonLink>
        </div>
      </CardContent>
    </Card>
  );
}

function Header() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">
          <Activity className="h-4 w-4" />
          Your posture plan
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">Today&apos;s corrective routine</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/scan" variant="primary"><Camera className="h-4 w-4" />Scan</ButtonLink>
        <ButtonLink href="/report" variant="secondary"><FileText className="h-4 w-4" />Report</ButtonLink>
        <ButtonLink href="/measurements" variant="secondary"><Ruler className="h-4 w-4" />Metrics</ButtonLink>
        <ButtonLink href="/history" variant="secondary"><History className="h-4 w-4" />History</ButtonLink>
      </div>
    </div>
  );
}

function PlanSummary({ latestScan, findings, exerciseCount }: { latestScan?: ScanAnalysis; findings: BodyFinding[]; exerciseCount: number }) {
  const primaryFindings = findings.slice(0, 3);

  return (
    <Card className="mt-6">
      <CardContent>
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">Personalized from scan</p>
            <h2 className="mt-1 text-2xl font-semibold">
              {latestScan ? "Built from your latest posture result" : "Starter plan until you scan"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#516156]">
              {latestScan
                ? `Latest scan: ${new Date(latestScan.createdAt).toLocaleString()}. Your routine is trimmed to ${exerciseCount} exercises that map to the highest-priority findings.`
                : "Run a scan to prioritize the plan around your forward-head, rounded-shoulder, trunk, and symmetry findings."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {primaryFindings.length > 0 ? primaryFindings.map((finding) => (
              <article key={finding.id} className={`rounded-md border p-3 ${findingSurfaceClass(finding.severity)}`}>
                <Badge tone={findingTone(finding.severity)}>{severityLabel(finding.severity)}</Badge>
                <h3 className="mt-3 text-sm font-semibold">{finding.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[#516156]">{finding.metricSummary}</p>
              </article>
            )) : starterExerciseNames.slice(0, 3).map((name) => (
              <article key={name} className="rounded-md border border-[#eef0ed] p-3">
                <Badge tone="muted">Starter</Badge>
                <h3 className="mt-3 text-sm font-semibold">{name}</h3>
                <p className="mt-1 text-xs leading-5 text-[#516156]">Baseline posture-control work until scan data is available.</p>
              </article>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyReview({ summary }: { summary: ReturnType<typeof buildWeeklyProgressReview> }) {
  return (
    <Card className={`mt-5 border ${weeklyReviewClass(summary.status)}`}>
      <CardContent>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em]">Weekly review</p>
            <h2 className="mt-1 text-xl font-semibold">{summary.summary}</h2>
          </div>
          <Badge tone={summary.status === "caution" ? "danger" : summary.status === "review" ? "success" : "muted"}>{summary.status}</Badge>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {summary.bullets.map((bullet) => (
            <p key={bullet} className="rounded-md bg-white/70 p-3 text-sm leading-5">{bullet}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TodayRoutine({
  exercises,
  completedToday,
  onToggle,
}: {
  exercises: PlanExercise[];
  completedToday: Set<string>;
  onToggle: (itemName: string) => void;
}) {
  return (
    <Card className="mt-5">
      <CardContent>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">Today</p>
            <h2 className="mt-1 text-2xl font-semibold">Do these in order</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#516156]">
              Start easy enough that your neck stays relaxed. Mark completion here, then use the guides below when an exercise is unclear.
            </p>
          </div>
          <Badge tone="muted">{exercises.length} exercises</Badge>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {exercises.map((exercise, index) => {
            const done = completedToday.has(exercise.item.name);
            return (
              <article key={exercise.item.name} className={`rounded-md border p-4 ${done ? "border-[#b9d8c5] bg-[#edf4ef]" : "border-[#d8ded7] bg-white"}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggle(exercise.item.name)}
                    className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-sm border ${done ? "border-[#237a57] bg-[#237a57] text-white" : "border-[#b9c5bc] bg-white"}`}
                    aria-label={done ? `Mark ${exercise.item.name} incomplete` : `Mark ${exercise.item.name} complete`}
                  >
                    {done ? <Check className="h-4 w-4" /> : index + 1}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-base font-semibold">{exercise.item.name}</h3>
                      <Badge tone={exercise.primaryFinding ? findingTone(exercise.primaryFinding.severity) : "muted"}>
                        {exercise.primaryFinding ? severityLabel(exercise.primaryFinding.severity) : "Starter"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#237a57]">{exercise.level.level}: {exercise.level.prescription}</p>
                    <p className="mt-2 text-sm leading-6 text-[#516156]">{exercise.reason}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={`#${exerciseId(exercise.item.name)}`} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cfd8d1] px-3 text-sm font-semibold">
                        <LinkIcon className="h-4 w-4" />
                        How to do it
                      </a>
                      <span className="inline-flex h-9 items-center rounded-md bg-[#f7f8f5] px-3 text-sm text-[#516156]">{exercise.dosage}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DailyCheckIn({
  checkInForm,
  checkInSummary,
  onChange,
  onSave,
}: {
  checkInForm: CheckInDraft;
  checkInSummary: ReturnType<typeof summarizeCheckIns>;
  onChange: (next: CheckInDraft | ((current: CheckInDraft) => CheckInDraft)) => void;
  onSave: () => void;
}) {
  return (
    <Card className="mt-5">
      <CardContent>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">Readiness</p>
            <h2 className="mt-1 text-xl font-semibold">Quick check-in</h2>
          </div>
          <div className="text-sm text-[#516156]">{checkInSummary.count} saved check-ins</div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SliderField label="Discomfort" value={checkInForm.discomfort} onChange={(value) => onChange((current) => ({ ...current, discomfort: value }))} />
          <SliderField label="Posture control" value={checkInForm.postureControl} onChange={(value) => onChange((current) => ({ ...current, postureControl: value }))} />
          <SliderField label="Energy" value={checkInForm.energy} onChange={(value) => onChange((current) => ({ ...current, energy: value }))} />
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm text-[#516156]">
          <input type="checkbox" checked={checkInForm.redFlags} onChange={(event) => onChange((current) => ({ ...current, redFlags: event.target.checked }))} className="mt-1" />
          Pain, numbness, weakness, dizziness, or symptoms worsened today.
        </label>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <textarea
            value={checkInForm.notes}
            onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Notes: sleep, desk setup, symptoms, exercise tolerance..."
            className="min-h-20 w-full rounded-md border border-[#cfd8d1] bg-white p-3 text-sm outline-none focus:border-[#237a57]"
          />
          <button onClick={onSave} className="h-11 rounded-md bg-[#17211b] px-4 text-sm font-semibold text-white md:self-end">Save</button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExerciseGuides({
  exercises,
  completedToday,
  onToggle,
}: {
  exercises: PlanExercise[];
  completedToday: Set<string>;
  onToggle: (itemName: string) => void;
}) {
  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#237a57]">Exercise guides</p>
          <h2 className="mt-1 text-2xl font-semibold">How to do each movement</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[#516156]">These are short-form guides for the selected plan, not the whole exercise library.</p>
      </div>
      <div className="mt-4 grid gap-4">
        {exercises.map((exercise) => (
          <ExerciseGuideCard key={exercise.item.name} exercise={exercise} done={completedToday.has(exercise.item.name)} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}

function ExerciseGuideCard({ exercise, done, onToggle }: { exercise: PlanExercise; done: boolean; onToggle: (itemName: string) => void }) {
  const reference = exerciseReferenceLinks[exercise.item.name];

  return (
    <Card id={exerciseId(exercise.item.name)} className={done ? "border-[#b9d8c5] bg-[#fbfffc]" : ""}>
      <CardContent>
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">{exercise.item.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[#237a57]">{exercise.level.level}: {exercise.level.name}</p>
              </div>
              <button onClick={() => onToggle(exercise.item.name)} className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold ${done ? "bg-[#237a57] text-white" : "border border-[#cfd8d1] bg-white"}`}>
                <Check className="h-4 w-4" />
                {done ? "Done" : "Mark done"}
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#516156]">{exercise.item.setup}</p>
            <div className="mt-4 rounded-md border border-[#eef0ed] bg-[#f7f8f5] p-3">
              <h4 className="text-sm font-semibold">Why it is here</h4>
              <p className="mt-1 text-sm leading-5 text-[#516156]">{exercise.reason}</p>
            </div>
            {reference && (
              <a href={reference.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-10 items-center gap-2 rounded-md border border-[#cfd8d1] bg-white px-3 text-sm font-semibold">
                <ExternalLink className="h-4 w-4" />
                {reference.label}
              </a>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-[#237a57]" />Steps</h4>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#35453a]">
                {exercise.item.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Cues</h4>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-[#35453a]">
                {exercise.item.cues.map((cue) => <li key={cue}>{cue}</li>)}
              </ul>
              <h4 className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#a74731]"><AlertTriangle className="h-4 w-4" />Stop if</h4>
              <p className="mt-2 text-sm leading-6 text-[#516156]">{exercise.item.stopIf}</p>
            </div>
          </div>
        </div>
        <details className="mt-4 rounded-md border border-[#eef0ed] p-3">
          <summary className="flex cursor-pointer items-center justify-between font-semibold">
            Progression levels
            <ChevronDown className="h-4 w-4" />
          </summary>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {exercise.item.levels.map((level) => (
              <article key={level.level} className={`rounded-md border p-3 ${level.level === exercise.level.level ? "border-[#b9d8c5] bg-[#edf4ef]" : "border-[#eef0ed]"}`}>
                <h5 className="font-semibold">{level.level}: {level.name}</h5>
                <p className="mt-1 text-sm font-medium text-[#237a57]">{level.prescription}</p>
                <p className="mt-2 text-xs leading-5 text-[#516156]">{level.whenToUse}</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-[#516156]"><span className="font-semibold text-[#17211b]">Progress when:</span> {exercise.item.progression}</p>
        </details>
      </CardContent>
    </Card>
  );
}

function ProgressAndEvidence({
  scans,
  trends,
  completions,
  routineCount,
}: {
  scans: ScanAnalysis[];
  trends: MeasurementTrend[];
  completions: ReturnType<typeof completionSummary>;
  routineCount: number;
}) {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <details className="rounded-md border border-[#d8ded7] bg-white p-4">
        <summary className="cursor-pointer text-lg font-semibold">Progress tracking</summary>
        <div className="mt-4 grid gap-4">
          <AdherenceChart completions={completions} routineCount={routineCount} />
          <MeasurementTargets scans={scans} />
          <TrendReadout trends={trends} />
        </div>
      </details>
      <details className="rounded-md border border-[#d8ded7] bg-white p-4">
        <summary className="cursor-pointer text-lg font-semibold">Evidence and guardrails</summary>
        <div className="mt-4 grid gap-4">
          <EvidenceCards />
          <ProtocolSummary />
        </div>
      </details>
    </section>
  );
}

function EvidenceCards() {
  return (
    <div className="grid gap-3">
      {evidenceTakeaways.map((item) => (
        <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="rounded-md border border-[#eef0ed] p-3 transition-colors hover:border-[#cfd8d1] hover:bg-[#fbfcfa]">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold">{item.title}</h3>
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[#667568]" />
          </div>
          <p className="mt-2 text-xs leading-5 text-[#516156]">{item.summary}</p>
        </a>
      ))}
      {evidenceNotes.map((source) => (
        <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="rounded-md border border-[#eef0ed] p-3 text-sm">
          <span className="font-semibold">{source.label}</span>
          <span className="mt-1 block text-xs uppercase tracking-[0.12em] text-[#237a57]">{source.type} · {source.strength} certainty</span>
          <span className="mt-2 block leading-5 text-[#516156]">{source.note}</span>
        </a>
      ))}
    </div>
  );
}

function ProtocolSummary() {
  return (
    <div className="grid gap-3">
      {protocolPhases.map((phase) => (
        <article key={phase.name} className="rounded-md border border-[#eef0ed] p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-semibold">{phase.name}</h3>
            <Badge tone="muted">{phase.timing}</Badge>
          </div>
          <p className="mt-2 text-sm leading-5 text-[#516156]">{phase.actions[0]}</p>
          <p className="mt-1 text-xs leading-5 text-[#667568]">Success: {phase.successCriteria[0]}</p>
        </article>
      ))}
      {decisionRules.map((rule) => (
        <article key={rule.trigger} className="rounded-md border border-[#eef0ed] p-3">
          <h3 className="text-sm font-semibold text-[#a74731]">If {rule.trigger.toLowerCase()}</h3>
          <p className="mt-1 text-sm leading-5 text-[#516156]">{rule.action}</p>
        </article>
      ))}
    </div>
  );
}

function AdherenceChart({ completions, routineCount }: { completions: ReturnType<typeof completionSummary>; routineCount: number }) {
  return (
    <article>
      <h3 className="font-semibold">14-day adherence</h3>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {completions.map((day) => (
          <div key={day.date} className="space-y-1">
            <div className="h-20 rounded-sm border border-[#eef0ed] bg-[#f7f8f5] p-1">
              <div className="mt-auto flex h-full items-end">
                <div className="w-full rounded-sm bg-[#237a57]" style={{ height: `${Math.min(100, (day.count / Math.max(1, routineCount)) * 100)}%` }} />
              </div>
            </div>
            <p className="text-center text-[10px] text-[#667568]">{day.date.slice(5)}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function MeasurementTargets({ scans }: { scans: ScanAnalysis[] }) {
  return (
    <article>
      <h3 className="font-semibold">Measurement targets</h3>
      <div className="mt-3 grid gap-3">
        {measurementTargets.slice(0, 6).map((target) => {
          const latest = latestMeasurement(scans, target.id);
          const baseline = baselineMeasurement(scans, target.id);
          const delta = measurementDelta(scans, target.id);
          return (
            <div key={target.id} className="rounded-md border border-[#eef0ed] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold">{target.label}</h4>
                  <p className="mt-1 text-sm text-[#516156]">{target.reason}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">{latest ? `${latest.value}${latest.unit}` : "No scan"}</div>
                  <div className="text-[#667568]">{delta === undefined ? "Need 2 scans" : `${delta > 0 ? "+" : ""}${delta}${latest?.unit ?? ""} vs baseline`}</div>
                </div>
              </div>
              {baseline && <p className="mt-1 text-xs text-[#667568]">Baseline: {baseline.value}{baseline.unit}</p>}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function TrendReadout({ trends }: { trends: MeasurementTrend[] }) {
  return (
    <article>
      <h3 className="font-semibold">Trend readout</h3>
      <div className="mt-3 grid gap-3">
        {trends.slice(0, 6).map((trend) => <TrendCard key={trend.id} trend={trend} />)}
      </div>
    </article>
  );
}

function TrendCard({ trend }: { trend: MeasurementTrend }) {
  const max = Math.max(...trend.points.map((point) => point.value), 1);
  const min = Math.min(...trend.points.map((point) => point.value), 0);
  const spread = Math.max(max - min, 1);

  return (
    <article className="rounded-md border border-[#eef0ed] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">{trend.label}</h4>
          <p className="mt-1 text-sm leading-5 text-[#516156]">{trend.summary}</p>
        </div>
        <Badge tone={trend.status === "improving" ? "success" : trend.status === "worsening" ? "danger" : trend.status === "mixed-quality" ? "warning" : "muted"}>{trend.status.replaceAll("-", " ")}</Badge>
      </div>
      <div className="mt-3 flex h-16 items-end gap-1 rounded-md bg-[#f7f8f5] p-2">
        {trend.points.length === 0 && <div className="grid h-full w-full place-items-center text-sm text-[#667568]">No scans yet</div>}
        {trend.points.map((point) => (
          <div key={`${point.date}-${point.value}`} className="flex h-full flex-1 items-end">
            <div className="w-full rounded-sm bg-[#237a57]" style={{ height: `${Math.max(6, ((point.value - min) / spread) * 86 + 8)}%` }} title={`${point.value}${point.unit}`} />
          </div>
        ))}
      </div>
    </article>
  );
}

function SliderField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block rounded-md border border-[#eef0ed] p-3">
      <span className="flex items-center justify-between text-sm font-semibold">
        {label}
        <span>{value}/10</span>
      </span>
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-[#237a57]"
      />
    </label>
  );
}

type PlanExercise = {
  item: RoutineItem;
  level: ExerciseLevel;
  reason: string;
  dosage: string;
  primaryFinding?: BodyFinding;
};

function recommendedExercises(findings: BodyFinding[], checkIn: CheckInDraft, completions: WorkoutCompletion[]): PlanExercise[] {
  const sourceFindings = findings.filter((finding) => finding.severity !== "low");
  const activeFindings = sourceFindings.length ? sourceFindings : findings.slice(0, 2);
  const exerciseNames = unique(activeFindings.flatMap((finding) => finding.exercises));
  const names = exerciseNames.length ? exerciseNames.slice(0, 5) : starterExerciseNames;

  return names
    .map((name) => {
      const item = routine.find((routineItem) => routineItem.name === name);
      if (!item) return undefined;
      const matchingFindings = activeFindings.filter((finding) => finding.exercises.includes(item.name));
      const primaryFinding = matchingFindings[0];
      const exercise: PlanExercise = {
        item,
        level: recommendedLevel(item, checkIn, completions),
        reason: primaryFinding
          ? `Targets ${matchingFindings.map((finding) => finding.title.toLowerCase()).join(", ")}.`
          : "Starter exercise for neck, upper-back, and shoulder control.",
        dosage: item.dosage,
      };
      if (primaryFinding) exercise.primaryFinding = primaryFinding;
      return exercise;
    })
    .filter((exercise): exercise is PlanExercise => exercise !== undefined);
}

function recommendedLevel(item: RoutineItem, checkIn: CheckInDraft, completions: WorkoutCompletion[]) {
  if (checkIn.redFlags || checkIn.discomfort >= 5) return item.levels[0];
  const recentCount = recentExerciseCount(completions, item.name);
  if (recentCount >= 8 && checkIn.discomfort <= 2 && checkIn.postureControl >= 7) return item.levels[2];
  if (recentCount >= 3 && checkIn.discomfort <= 3) return item.levels[1];
  return item.levels[0];
}

function recentExerciseCount(completions: WorkoutCompletion[], itemName: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  return completions.filter((completion) => completion.itemName === itemName && completion.date >= cutoffKey).length;
}

function todayCheckInDraft(): CheckInDraft {
  return getTodayCheckIn() ?? {
    date: todayKey(),
    discomfort: 0,
    postureControl: 5,
    energy: 5,
    redFlags: false,
    notes: "",
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function exerciseId(name: string) {
  return `exercise-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function findingTone(severity: BodyFindingSeverity) {
  if (severity === "high") return "danger";
  if (severity === "moderate") return "warning";
  return "success";
}

function findingSurfaceClass(severity: BodyFindingSeverity) {
  if (severity === "high") return "border-[#e8b2a4] bg-[#fffafa]";
  if (severity === "moderate") return "border-[#ead58e] bg-[#fffdf5]";
  return "border-[#eef0ed] bg-white";
}

function weeklyReviewClass(status: ReturnType<typeof buildWeeklyProgressReview>["status"]) {
  if (status === "caution") return "border-[#f0c7b9] bg-[#faeee9] text-[#6d2d1f]";
  if (status === "review") return "border-[#b9d8c5] bg-[#edf4ef] text-[#17211b]";
  return "border-[#d8ded7] bg-white text-[#17211b]";
}
