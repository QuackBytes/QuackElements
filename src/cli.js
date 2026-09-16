import { readFile } from "node:fs/promises";
import path from "node:path";
import { CONFIG_FILE, DEFAULT_CONFIG, exists, loadConfig, saveDefaultConfig } from "./config.js";
import { getRegistry, installFoundation, installItems } from "./installer.js";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const VERSION = packageJson.version;

export async function run(argv, options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const [command = "help", ...args] = argv;

  switch (command) {
    case "init":
      await init(cwd, args);
      break;
    case "add":
      await add(cwd, args);
      break;
    case "list":
      await list();
      break;
    case "doctor":
      await doctor(cwd);
      break;
    case "--version":
    case "-v":
    case "version":
      console.log(VERSION);
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      throw new Error(`Unknown command \"${command}\". Run \"quackelements help\".`);
  }
}

async function init(cwd, args) {
  const overwrite = args.includes("--force");
  const packagePath = path.join(cwd, "package.json");

  if (!(await exists(packagePath))) {
    throw new Error("No package.json found. Run this command inside a JavaScript project.");
  }

  const configResult = await saveDefaultConfig(cwd, { overwrite });
  const config = configResult.status === "kept" ? await loadConfig(cwd) : DEFAULT_CONFIG;
  const foundationResults = await installFoundation(cwd, config, { overwrite });

  console.log("QuackElements initialized.\n");
  printFileResult(configResult, cwd);
  for (const result of foundationResults) printFileResult(result, cwd);
  console.log(`\nImport \"${config.paths.styles}\" once in your application entry file.`);
}

async function add(cwd, args) {
  const overwrite = args.includes("--overwrite");
  const addAll = args.includes("--all");
  let names = args.filter((arg) => !arg.startsWith("--"));

  if (addAll) {
    const registry = await getRegistry();
    names = registry.items.filter((item) => item.type === "component").map((item) => item.name);
  }

  if (names.length === 0) {
    throw new Error("Provide at least one component: quackelements add button");
  }

  const config = await loadConfig(cwd);
  const results = await installItems(cwd, config, names, { overwrite });

  for (const result of results) {
    console.log(`\n${result.name}`);
    for (const file of result.files) printFileResult(file, cwd);
  }
}

async function list() {
  const registry = await getRegistry();
  console.log("Available QuackElements components:\n");
  for (const item of registry.items) {
    console.log(`  ${item.name.padEnd(16)} ${item.description}`);
  }
}

async function doctor(cwd) {
  const checks = [];
  const packagePath = path.join(cwd, "package.json");
  checks.push(["package.json", await exists(packagePath)]);
  checks.push([CONFIG_FILE, await exists(path.join(cwd, CONFIG_FILE))]);

  if (checks[1][1]) {
    const config = await loadConfig(cwd);
    checks.push([config.paths.styles, await exists(path.join(cwd, config.paths.styles))]);
    checks.push([config.paths.utils, await exists(path.join(cwd, config.paths.utils))]);
  }

  if (checks[0][1]) {
    const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
    const hasReact = Boolean(
      packageJson.dependencies?.react ||
      packageJson.devDependencies?.react ||
      (await exists(path.join(cwd, "node_modules", "react", "package.json")))
    );
    checks.push(["React dependency", hasReact]);
  }

  for (const [label, healthy] of checks) {
    console.log(`${healthy ? "PASS" : "FAIL"}  ${label}`);
  }

  if (checks.some(([, healthy]) => !healthy)) {
    process.exitCode = 1;
  }
}

function printFileResult(result, cwd) {
  const relativePath = path.relative(cwd, result.path);
  console.log(`  ${result.status === "created" ? "CREATE" : "KEEP  "} ${relativePath}`);
}

function printHelp() {
  console.log(`QuackElements ${VERSION}

Usage:
  quackelements init [--force]
  quackelements add <component...> [--overwrite]
  quackelements add --all [--overwrite]
  quackelements list
  quackelements doctor

Aliases:
  quackelements, qe`);
}
