import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

export type LicenseStatus = "available" | "activated" | "disabled";

export type LicenseRecord = {
  code: string;
  status: LicenseStatus;
  createdAt: string;
  machineId: string | null;
  activatedAt: string | null;
  note: string | null;
};

export type LicenseStore = {
  licenses: LicenseRecord[];
};

export type LicenseExportScope = "active" | "available" | "activated" | "all";

export type GenerateLicensesInput = {
  count: number;
  prefix?: string;
};

type BindingRow = {
  code: string;
  machineId: string;
  updatedAt: number;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "license-store.json");
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const execFileAsync = promisify(execFile);

function createEmptyStore(): LicenseStore {
  return { licenses: [] };
}

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(STORE_PATH, "utf-8");
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(createEmptyStore(), null, 2), "utf-8");
  }
}

function migrateLicenseRecord(item: Record<string, unknown>): LicenseRecord | null {
  const code = typeof item.code === "string" ? item.code : null;
  if (!code) {
    return null;
  }

  const rawStatus = typeof item.status === "string" ? item.status : "available";
  const status: LicenseStatus =
    rawStatus === "activated" || rawStatus === "disabled" || rawStatus === "available"
      ? rawStatus
      : rawStatus === "assigned"
        ? "activated"
        : "available";

  const machineId =
    typeof item.machineId === "string"
      ? item.machineId
      : typeof item.assignedTo === "string"
        ? item.assignedTo
        : null;

  const activatedAt =
    typeof item.activatedAt === "string"
      ? item.activatedAt
      : typeof item.assignedAt === "string"
        ? item.assignedAt
        : null;

  return {
    code,
    status,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    machineId,
    activatedAt,
    note: typeof item.note === "string" ? item.note : null,
  };
}

async function readStore(): Promise<LicenseStore> {
  await ensureStoreFile();
  const raw = await readFile(STORE_PATH, "utf-8");

  try {
    const parsed = JSON.parse(raw) as { licenses?: Record<string, unknown>[] };
    return {
      licenses: Array.isArray(parsed.licenses)
        ? parsed.licenses
            .map((item) => migrateLicenseRecord(item))
            .filter((item): item is LicenseRecord => item !== null)
        : [],
    };
  } catch {
    return createEmptyStore();
  }
}

async function writeStore(store: LicenseStore) {
  await ensureStoreFile();
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

async function updateEnvFile(filePath: string, key: string, value: string) {
  let content = "";

  try {
    content = await readFile(filePath, "utf-8");
  } catch {
    content = "";
  }

  const line = `${key}=${value}`;

  if (!content.trim()) {
    await writeFile(filePath, `${line}\n`, "utf-8");
    return;
  }

  const lines = content.split(/\r?\n/);
  let replaced = false;
  const nextLines = lines.map((item) => {
    if (item.trimStart().startsWith(`${key}=`)) {
      replaced = true;
      return line;
    }

    return item;
  });

  if (!replaced) {
    if (nextLines[nextLines.length - 1] !== "") {
      nextLines.push("");
    }
    nextLines.push(line);
  }

  await writeFile(filePath, `${nextLines.join("\n").replace(/\n+$/, "\n")}`, "utf-8");
}

function getPythonCandidates() {
  const openClawDir = getOpenClawDir();
  return process.platform === "win32"
    ? [path.join(openClawDir, ".venv", "Scripts", "python.exe"), "python", "py"]
    : [path.join(openClawDir, ".venv", "bin", "python"), "python3", "python"];
}

async function runPythonScript(script: string, args: string[]) {
  let lastError: unknown;
  const openClawDir = getOpenClawDir();

  for (const candidate of getPythonCandidates()) {
    try {
      const result = await execFileAsync(candidate, ["-c", script, ...args], {
        cwd: openClawDir,
        windowsHide: true,
      });
      return result.stdout;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("PYTHON_NOT_FOUND");
}

function randomChunk(length: number) {
  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * CODE_CHARS.length);
    return CODE_CHARS[index];
  }).join("");
}

function createLicenseCode(prefix = "CLAW") {
  return `${prefix.toUpperCase()}-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}`;
}

function sanitizePrefix(prefix?: string) {
  const normalized = (prefix ?? "CLAW").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return normalized || "CLAW";
}

function getOpenClawDir() {
  const configured = process.env.OPENCLAW_DIR?.trim();
  return configured ? path.resolve(configured) : path.resolve(process.cwd(), "..", "openClaw");
}

function getOpenClawDbPath() {
  const configured = process.env.OPENCLAW_DB_PATH?.trim();
  return configured ? path.resolve(configured) : path.join(getOpenClawDir(), "data", "license.db");
}

function getOpenClawSyncFiles() {
  const configured = process.env.OPENCLAW_SYNC_FILES?.trim();
  if (configured) {
    return configured
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => path.resolve(item));
  }

  const openClawDir = getOpenClawDir();
  return [
    path.join(openClawDir, ".env"),
    path.join(openClawDir, "local_activation_codes.env"),
  ];
}

export function normalizeLicenseCode(code: string) {
  return code.replace(/[\s-]+/g, "").toUpperCase();
}

function filterLicensesByScope(licenses: LicenseRecord[], scope: LicenseExportScope) {
  switch (scope) {
    case "available":
    case "active":
      return licenses.filter((item) => item.status === "available");
    case "activated":
      return licenses.filter((item) => item.status === "activated");
    case "all":
      return licenses;
    default:
      return licenses.filter((item) => item.status === "available");
  }
}

async function readOpenClawBindings(): Promise<BindingRow[]> {
  const script = `
import json
import sqlite3
import sys
from pathlib import Path

db_path = Path(sys.argv[1])
db_path.parent.mkdir(parents=True, exist_ok=True)
conn = sqlite3.connect(str(db_path))
conn.execute("""
CREATE TABLE IF NOT EXISTS license_bindings (
    code_norm TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL,
    updated_at REAL NOT NULL
)
""")
rows = conn.execute(
    "SELECT code_norm, machine_id, updated_at FROM license_bindings"
).fetchall()
conn.close()
print(json.dumps([
    {"code": row[0], "machineId": row[1], "updatedAt": row[2]}
    for row in rows
], ensure_ascii=False))
`;

  const stdout = await runPythonScript(script, [getOpenClawDbPath()]);
  const parsed = JSON.parse(stdout) as BindingRow[];
  return Array.isArray(parsed) ? parsed : [];
}

async function syncBindingsIntoStore(store?: LicenseStore) {
  const sourceStore = store ?? (await readStore());
  const bindings = await readOpenClawBindings();
  const bindingMap = new Map(bindings.map((item) => [item.code, item]));
  let changed = false;

  const licenses: LicenseRecord[] = sourceStore.licenses.map((item) => {
    const binding = bindingMap.get(normalizeLicenseCode(item.code));
    if (!binding) {
      if (item.status === "activated" && item.machineId) {
        changed = true;
        return {
          ...item,
          status: "available",
          machineId: null,
          activatedAt: null,
        };
      }
      return item.status === "disabled"
        ? item
        : {
            ...item,
            status: "available",
            machineId: null,
            activatedAt: null,
          };
    }

    const nextActivatedAt = new Date(binding.updatedAt * 1000).toISOString();
    if (
      item.status !== "activated" ||
      item.machineId !== binding.machineId ||
      item.activatedAt !== nextActivatedAt
    ) {
      changed = true;
    }

    return {
      ...item,
      status: item.status === "disabled" ? "disabled" : "activated",
      machineId: binding.machineId,
      activatedAt: nextActivatedAt,
    };
  });

  const nextStore: LicenseStore = { licenses };
  if (changed) {
    await writeStore(nextStore);
  }

  return nextStore;
}

export async function getLicenses() {
  const syncedStore = await syncBindingsIntoStore();
  return [...syncedStore.licenses].sort((a, b) => {
    const left = a.activatedAt ?? a.createdAt;
    const right = b.activatedAt ?? b.createdAt;
    return right.localeCompare(left);
  });
}

export async function getLicenseDashboard() {
  const licenses = await getLicenses();

  return {
    licenses,
    stats: {
      total: licenses.length,
      available: licenses.filter((item) => item.status === "available").length,
      activated: licenses.filter((item) => item.status === "activated").length,
      disabled: licenses.filter((item) => item.status === "disabled").length,
    },
  };
}

export async function generateLicenses(input: GenerateLicensesInput) {
  const count = Math.max(1, Math.min(200, Math.floor(input.count)));
  const prefix = sanitizePrefix(input.prefix);
  const store = await syncBindingsIntoStore();
  const existingCodes = new Set(store.licenses.map((item) => item.code));
  const created: LicenseRecord[] = [];

  while (created.length < count) {
    const code = createLicenseCode(prefix);
    if (existingCodes.has(code)) {
      continue;
    }

    existingCodes.add(code);
    created.push({
      code,
      status: "available",
      createdAt: new Date().toISOString(),
      machineId: null,
      activatedAt: null,
      note: null,
    });
  }

  store.licenses.unshift(...created);
  await writeStore(store);

  return created;
}

export async function exportLicenses(scope: LicenseExportScope = "active") {
  const licenses = await getLicenses();
  const filtered = filterLicensesByScope(licenses, scope);
  const normalizedCodes = filtered.map((item) => normalizeLicenseCode(item.code));

  return {
    scope,
    count: filtered.length,
    licenses: filtered,
    normalizedCodes,
    envText: `OPENCLAW_LICENSE_CODES=${normalizedCodes.join(",")}`,
    txtText: normalizedCodes.join("\n"),
    jsonText: JSON.stringify(
      {
        scope,
        count: filtered.length,
        exportedAt: new Date().toISOString(),
        codes: normalizedCodes,
        records: filtered,
      },
      null,
      2,
    ),
  };
}

export async function syncOpenClawLicensePool(store?: LicenseStore) {
  const sourceStore = await syncBindingsIntoStore(store);
  const filtered = filterLicensesByScope(sourceStore.licenses, "available");
  const normalizedCodes = filtered.map((item) => normalizeLicenseCode(item.code));
  const csv = normalizedCodes.join(",");
  const openClawDbPath = getOpenClawDbPath();
  const openClawSyncFiles = getOpenClawSyncFiles();

  const syncScript = `
import sqlite3
import sys
import time
from pathlib import Path

db_path = Path(sys.argv[1])
codes = [item for item in sys.argv[2].split(",") if item]
db_path.parent.mkdir(parents=True, exist_ok=True)
conn = sqlite3.connect(str(db_path))
conn.execute("""
CREATE TABLE IF NOT EXISTS license_pool (
    code_norm TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    source TEXT NOT NULL,
    updated_at REAL NOT NULL
)
""")
now = time.time()
conn.execute("DELETE FROM license_pool WHERE source = ?", ("backend",))
conn.executemany(
    "INSERT INTO license_pool (code_norm, status, source, updated_at) VALUES (?, ?, ?, ?)",
    [(code, "active", "backend", now) for code in codes],
)
conn.commit()
conn.close()
`;

  await runPythonScript(syncScript, [openClawDbPath, csv]);

  await Promise.all(
    openClawSyncFiles.map((filePath) => updateEnvFile(filePath, "OPENCLAW_LICENSE_CODES", csv)),
  );

  return {
    count: normalizedCodes.length,
    dbPath: openClawDbPath,
    files: openClawSyncFiles,
  };
}
