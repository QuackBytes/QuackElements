import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { exists } from "./config.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryRoot = path.join(packageRoot, "registry");

export async function getRegistry() {
  const manifestPath = path.join(registryRoot, "registry.json");
  return JSON.parse(await readFile(manifestPath, "utf8"));
}

export async function installFoundation(cwd, config, { overwrite = false } = {}) {
  const styleDirectory = path.dirname(path.join(cwd, config.paths.styles));
  const theme = config.theme ?? "default";
  const files = [
    {
      source: path.join(registryRoot, "foundation", "quack-elements.css"),
      target: path.join(cwd, config.paths.styles)
    },
    {
      source: path.join(registryRoot, "foundation", "quack-tailwind.css"),
      target: path.join(styleDirectory, "quack-tailwind.css")
    },
    {
      source: path.join(registryRoot, "foundation", "themes", `${theme}.css`),
      target: path.join(styleDirectory, "quack-theme.css")
    },
    {
      source: path.join(registryRoot, "foundation", "quack-elements.ts"),
      target: path.join(cwd, config.paths.utils)
    }
  ];

  return copyFiles(files, { overwrite, language: config.language });
}

export async function installItems(cwd, config, names, { overwrite = false } = {}) {
  const registry = await getRegistry();
  const knownItems = new Map(registry.items.map((item) => [item.name, item]));
  const results = [];
  const resolved = new Set();

  async function installItem(name) {
    if (resolved.has(name)) return;

    if (!/^[a-z0-9-]+$/.test(name)) {
      throw new Error(`Invalid component name: ${name}`);
    }

    const item = knownItems.get(name);
    if (!item) {
      throw new Error(`Unknown component \"${name}\". Run \"quackelements list\".`);
    }

    for (const dependency of item.dependencies ?? []) {
      await installItem(dependency);
    }

    const itemFiles = item.files.map((file) => ({
      source: path.join(registryRoot, item.name, file.source),
      target: path.join(
        cwd,
        config.paths[file.targetRoot ?? "components"],
        languageTarget(file.target, config.language)
      )
    }));

    const installed = await copyFiles(itemFiles, { overwrite, language: config.language });

    results.push({ name, files: installed });
    resolved.add(name);
  }

  for (const name of names) {
    await installItem(name);
  }

  return results;
}

async function copyFiles(
  files,
  { overwrite = false, replacements = {}, language = "tsx" } = {}
) {
  const results = [];

  for (const file of files) {
    if (!overwrite && (await exists(file.target))) {
      results.push({ path: file.target, status: "kept" });
      continue;
    }

    let content = await readFile(file.source, "utf8");
    for (const [token, value] of Object.entries(replacements)) {
      content = content.replaceAll(token, value);
    }
    content = transformLanguage(content, file.source, language);

    await mkdir(path.dirname(file.target), { recursive: true });
    await writeFile(file.target, content, "utf8");
    results.push({ path: file.target, status: "created" });
  }

  return results;
}

function languageTarget(target, language) {
  if (language !== "jsx") return target;
  return target.replace(/\.tsx$/, ".jsx").replace(/\.ts$/, ".js");
}

function transformLanguage(content, source, language) {
  if (language !== "jsx" || !/\.tsx?$/.test(source)) return content;

  return ts.transpileModule(content, {
    fileName: source,
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
}
