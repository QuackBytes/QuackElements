import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const CONFIG_FILE = "quackelements.json";

export const DEFAULT_CONFIG = Object.freeze({
  version: 1,
  language: "tsx",
  paths: {
    components: "src/components/quack",
    hooks: "src/hooks",
    styles: "src/styles/quack-elements.css",
    utils: "src/lib/quack-elements.ts"
  }
});

export async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function loadConfig(cwd) {
  const configPath = path.join(cwd, CONFIG_FILE);

  if (!(await exists(configPath))) {
    throw new Error(`No ${CONFIG_FILE} found. Run \"quackelements init\" first.`);
  }

  const parsed = JSON.parse(await readFile(configPath, "utf8"));
  validateConfig(parsed);
  return parsed;
}

export async function saveDefaultConfig(cwd, { overwrite = false } = {}) {
  const configPath = path.join(cwd, CONFIG_FILE);

  if (!overwrite && (await exists(configPath))) {
    return { path: configPath, status: "kept" };
  }

  await writeFile(configPath, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, "utf8");
  return { path: configPath, status: "created" };
}

function validateConfig(config) {
  if (config?.version !== 1) {
    throw new Error("Unsupported QuackElements config version.");
  }

  for (const key of ["components", "hooks", "styles", "utils"]) {
    if (typeof config.paths?.[key] !== "string" || !config.paths[key]) {
      throw new Error(`Invalid config path: paths.${key}`);
    }

    if (path.isAbsolute(config.paths[key]) || config.paths[key].includes("..")) {
      throw new Error(`Config paths must stay inside the project: paths.${key}`);
    }
  }
}
