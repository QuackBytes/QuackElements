import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const CONFIG_FILE = "quackelements.json";
export const THEMES = Object.freeze(["default", "monochrome"]);
export const LANGUAGES = Object.freeze(["tsx", "jsx"]);

export const DEFAULT_CONFIG = Object.freeze({
  version: 1,
  language: "tsx",
  theme: "default",
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
  const config = {
    ...parsed,
    language: parsed.language ?? "tsx",
    theme: parsed.theme ?? "default"
  };
  validateConfig(config);
  return config;
}

export async function saveDefaultConfig(
  cwd,
  { overwrite = false, theme = "default", language = "tsx" } = {}
) {
  const configPath = path.join(cwd, CONFIG_FILE);

  if (!overwrite && (await exists(configPath))) {
    return { path: configPath, status: "kept" };
  }

  validateTheme(theme);
  validateLanguage(language);
  const config = {
    ...DEFAULT_CONFIG,
    language,
    theme,
    paths: {
      ...DEFAULT_CONFIG.paths,
      utils: language === "jsx" ? "src/lib/quack-elements.js" : DEFAULT_CONFIG.paths.utils
    }
  };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return { path: configPath, status: "created" };
}

function validateConfig(config) {
  if (config?.version !== 1) {
    throw new Error("Unsupported QuackElements config version.");
  }

  validateTheme(config.theme);
  validateLanguage(config.language);

  for (const key of ["components", "hooks", "styles", "utils"]) {
    if (typeof config.paths?.[key] !== "string" || !config.paths[key]) {
      throw new Error(`Invalid config path: paths.${key}`);
    }

    if (path.isAbsolute(config.paths[key]) || config.paths[key].includes("..")) {
      throw new Error(`Config paths must stay inside the project: paths.${key}`);
    }
  }
}

export function validateTheme(theme) {
  if (!THEMES.includes(theme)) {
    throw new Error(`Unknown theme "${theme}". Choose one of: ${THEMES.join(", ")}.`);
  }
}

export function validateLanguage(language) {
  if (!LANGUAGES.includes(language)) {
    throw new Error(`Unknown language "${language}". Choose one of: ${LANGUAGES.join(", ")}.`);
  }
}
