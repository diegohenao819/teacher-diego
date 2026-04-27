import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const files = [".env.local", ".env"];
const originalKeys = new Set(Object.keys(process.env));

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separator = trimmed.indexOf("=");
  if (separator === -1) {
    return null;
  }

  const key = trimmed.slice(0, separator).trim();
  let value = trimmed.slice(separator + 1).trim();
  if (!key) {
    return null;
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

for (const file of files) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) {
    continue;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const parsed = parseEnvLine(line);
    if (!parsed) {
      continue;
    }

    const [key, value] = parsed;
    if (originalKeys.has(key)) {
      continue;
    }

    process.env[key] = value;
  }
}
