import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { envWithLocalFile, invalidEnvMessages } from "./setup-check.mjs";
import { appTables } from "./check-supabase-schema.mjs";

export const requiredSupabaseLiveEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export async function checkLiveSupabase({
  env = envWithLocalFile(),
  client = createLiveSupabaseClient(env),
  tables = appTables,
} = {}) {
  const missing = requiredSupabaseLiveEnv.filter((name) => !env[name]);
  const invalid = invalidEnvMessages(env).filter((message) => message.startsWith("NEXT_PUBLIC_SUPABASE_URL"));

  if (missing.length > 0 || invalid.length > 0) {
    return {
      ok: false,
      missing,
      invalid,
      tableChecks: [],
      storage: { ok: false, detail: "not checked because Supabase env is incomplete" },
    };
  }

  const tableChecks = [];
  for (const table of tables) {
    const { error } = await client.from(table).select("id", { count: "exact", head: true });
    tableChecks.push({
      table,
      ok: !error,
      detail: error ? safeError(error) : "selectable by service role",
    });
  }

  const storage = await checkScanImagesBucket(client);

  return {
    ok: tableChecks.every((check) => check.ok) && storage.ok,
    missing,
    invalid,
    tableChecks,
    storage,
  };
}

export function formatLiveSupabaseCheck(result) {
  const lines = [
    `Live Supabase check: ${result.ok ? "PASS" : "FAIL"}`,
  ];

  if (result.missing.length > 0) {
    lines.push("Missing Supabase env vars:");
    lines.push(...result.missing.map((name) => `- ${name}`));
  }

  if (result.invalid.length > 0) {
    lines.push("Invalid Supabase env vars:");
    lines.push(...result.invalid.map((message) => `- ${message}`));
  }

  if (result.tableChecks.length > 0) {
    lines.push("Tables:");
    lines.push(...result.tableChecks.map((check) => `- ${check.ok ? "PASS" : "FAIL"} ${check.table}: ${check.detail}`));
  }

  lines.push(`Storage: ${result.storage.ok ? "PASS" : "FAIL"} ${result.storage.detail}`);

  return lines.join("\n");
}

function createLiveSupabaseClient(env) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function checkScanImagesBucket(client) {
  if (!client) return { ok: false, detail: "client unavailable" };

  const { data, error } = await client.storage.listBuckets();
  if (error) {
    return { ok: false, detail: safeError(error) };
  }

  const bucket = data?.find((item) => item.name === "scan-images");
  if (!bucket) {
    return { ok: false, detail: "scan-images bucket is missing" };
  }
  if (bucket.public) {
    return { ok: false, detail: "scan-images bucket must be private" };
  }

  return { ok: true, detail: "scan-images bucket exists and is private" };
}

function safeError(error) {
  return error.message || error.code || "Supabase request failed";
}

async function main() {
  const result = await checkLiveSupabase();
  const output = formatLiveSupabaseCheck(result);

  if (result.ok) {
    console.log(output);
    return;
  }

  console.error(output);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
