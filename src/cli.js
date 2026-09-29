import { readFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import {
  CONFIG_FILE,
  exists,
  loadConfig,
  saveDefaultConfig,
  validateLanguage,
  validateTheme
} from "./config.js";
import { getRegistry, installFoundation, installItems } from "./installer.js";
import { addFoundationImport, scaffoldProject } from "./scaffold.js";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const VERSION = packageJson.version;
const RECOMMENDED_ITEMS = ["button", "input", "card", "dialog", "dropdown-menu", "toast"];
const PACKAGE_MANAGERS = new Set(["npm", "pnpm", "yarn", "bun"]);

export async function run(argv, options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const [command = "help", ...args] = argv;

  switch (command) {
    case "init":
      if (args.includes("--help") || args.includes("-h")) {
        printHelp();
        break;
      }
      if (await exists(path.join(cwd, "package.json"))) await init(cwd, args, options);
      else await create(cwd, args, options);
      break;
    case "create":
      if (args.includes("--help") || args.includes("-h")) {
        printHelp();
        break;
      }
      await create(cwd, args, options);
      break;
    case "add":
      await add(cwd, args);
      break;
    case "list":
      await list(args);
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

async function init(cwd, args, options) {
  const overwrite = args.includes("--force");
  const packagePath = path.join(cwd, "package.json");

  if (!(await exists(packagePath))) {
    throw new Error("No package.json found. Run this command inside a JavaScript project.");
  }

  const configExists = await exists(path.join(cwd, CONFIG_FILE));
  const requestedTheme = readOption(args, "--theme");
  const requestedLanguage = readLanguage(args);
  if (requestedTheme) validateTheme(requestedTheme);
  if (requestedLanguage) validateLanguage(requestedLanguage);

  let theme = requestedTheme;
  if (!theme && (!configExists || overwrite)) {
    theme = await chooseTheme(options.promptTheme);
  }

  const configResult = await saveDefaultConfig(cwd, {
    overwrite,
    theme: theme ?? "default",
    language: requestedLanguage ?? "tsx"
  });
  const config = await loadConfig(cwd);
  const foundationResults = await installFoundation(cwd, config, { overwrite });

  console.log(`QuackElements initialized with the ${formatTheme(config.theme)} theme.\n`);
  printFileResult(configResult, cwd);
  for (const result of foundationResults) printFileResult(result, cwd);
  console.log(`\nImport \"${config.paths.styles}\" once in your application entry file.`);
}

async function create(cwd, args, options) {
  const values = await resolveCreateOptions(args, options);
  const createProject = options.createProject ?? scaffoldProject;
  const project = await createProject({
    cwd,
    ...values,
    version: VERSION,
    packageManager: values.packageManager,
    runCommand: options.runCommand
  });

  await init(
    project,
    ["--force", "--theme", values.theme, "--language", values.language],
    options
  );

  if (values.install === "recommended") {
    await add(project, RECOMMENDED_ITEMS);
  } else if (values.install === "all") {
    await add(project, ["--all"]);
  }

  await addFoundationImport(project, values.template);
  console.log(`\nQuackElements project ready in ${path.relative(cwd, project)}.`);
  console.log(`\n  cd ${path.relative(cwd, project)}`);
  console.log(`  ${values.packageManager} run dev\n`);
}

async function resolveCreateOptions(args, options) {
  const yes = args.includes("--yes") || args.includes("-y");
  const positional = args.filter(
    (arg, index) =>
      !arg.startsWith("-") &&
      !["--name", "--template", "--theme", "--language", "--install", "--package-manager"].includes(args[index - 1])
  )[0];
  const requested = {
    name: readOption(args, "--name") ?? positional,
    template: readOption(args, "--template"),
    language: readLanguage(args),
    theme: readOption(args, "--theme"),
    install: readOption(args, "--install"),
    packageManager: readOption(args, "--package-manager")
  };

  if (options.promptCreateOptions) {
    return validateCreateOptions({ ...requested, ...(await options.promptCreateOptions(requested)) });
  }

  if (yes || !process.stdin.isTTY || !process.stdout.isTTY) {
    return validateCreateOptions({
      name: requested.name ?? "quack-app",
      template: requested.template ?? "next",
      language: requested.language ?? "tsx",
      theme: requested.theme ?? "default",
      install: requested.install ?? "recommended",
      packageManager: requested.packageManager
    });
  }

  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log("Create a new QuackElements project:\n");
    return validateCreateOptions({
      name: requested.name ?? (await askText(terminal, "Project name", "quack-app")),
      template: requested.template ?? (await askChoice(terminal, "Framework", ["Next.js", "Vite"], ["next", "vite"])),
      language: requested.language ?? (await askChoice(terminal, "Language", ["TypeScript", "JavaScript"], ["tsx", "jsx"])),
      theme: requested.theme ?? (await askChoice(terminal, "Theme", ["Default", "Monochrome"], ["default", "monochrome"])),
      install: requested.install ?? (await askChoice(
        terminal,
        "Install set",
        ["Recommended components", "Foundation only", "Everything"],
        ["recommended", "foundation", "all"]
      )),
      packageManager: requested.packageManager
    });
  } finally {
    terminal.close();
  }
}

function validateCreateOptions(values) {
  if (!values.name) throw new Error("Project name is required.");
  if (!new Set(["next", "vite"]).has(values.template)) {
    throw new Error('Unknown template. Choose one of: next, vite.');
  }
  validateLanguage(values.language);
  validateTheme(values.theme);
  if (!new Set(["foundation", "recommended", "all"]).has(values.install)) {
    throw new Error('Unknown install set. Choose one of: foundation, recommended, all.');
  }
  const packageManager = values.packageManager ?? detectPackageManager();
  if (!PACKAGE_MANAGERS.has(packageManager)) {
    throw new Error('Unknown package manager. Choose one of: npm, pnpm, yarn, bun.');
  }
  return { ...values, packageManager };
}

function detectPackageManager() {
  return (process.env.npm_config_user_agent ?? "npm").split("/")[0];
}

async function askText(terminal, label, fallback) {
  const answer = (await terminal.question(`${label} [${fallback}]: `)).trim();
  return answer || fallback;
}

async function askChoice(terminal, label, labels, values) {
  console.log(`${label}:`);
  labels.forEach((item, index) => console.log(`  ${index + 1}. ${item}`));
  const answer = (await terminal.question(`Choose [1]: `)).trim();
  if (!answer) return values[0];
  const number = Number.parseInt(answer, 10);
  if (number >= 1 && number <= values.length) return values[number - 1];
  const normalized = answer.toLowerCase();
  const direct = values.find((value) => value === normalized);
  if (direct) return direct;
  throw new Error(`Unknown ${label.toLowerCase()} selection "${answer}".`);
}

async function chooseTheme(promptTheme) {
  if (promptTheme) {
    const theme = await promptTheme();
    validateTheme(theme);
    return theme;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) return "default";

  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log("Choose a QuackElements color theme:\n");
    console.log("  1. Default     Warm yellow and orange accents");
    console.log("  2. Monochrome  Black, gray, and off-white\n");
    const answer = (await terminal.question("Theme [1]: ")).trim().toLowerCase();
    if (["2", "monochrome", "mono"].includes(answer)) return "monochrome";
    if (["", "1", "default"].includes(answer)) return "default";
    throw new Error(`Unknown theme selection "${answer}".`);
  } finally {
    terminal.close();
  }
}

function readOption(args, name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);

  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function readLanguage(args) {
  if (args.includes("--typescript")) return "tsx";
  if (args.includes("--javascript")) return "jsx";
  return readOption(args, "--language");
}

function formatTheme(theme) {
  return theme === "monochrome" ? "Monochrome" : "Default";
}

async function add(cwd, args) {
  const overwrite = args.includes("--overwrite");
  const addAll = args.includes("--all");
  const category = readOption(args, "--category");
  let names = args.filter(
    (arg, index) => !arg.startsWith("--") && args[index - 1] !== "--category"
  );

  if (category && category !== "components" && category !== "backgrounds") {
    throw new Error('Unknown category. Choose one of: components, backgrounds.');
  }

  if (addAll || category) {
    const registry = await getRegistry();
    names = registry.items
      .filter((item) => {
        if (category === "backgrounds") return item.type === "background";
        if (category === "components") return item.type === "component";
        return item.type === "component" || item.type === "background";
      })
      .map((item) => item.name);
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

async function list(args) {
  const registry = await getRegistry();
  const category = readOption(args, "--category");
  if (category && category !== "components" && category !== "backgrounds") {
    throw new Error('Unknown category. Choose one of: components, backgrounds.');
  }

  console.log("Available QuackElements items:\n");
  for (const item of registry.items.filter((entry) => {
    if (category === "backgrounds") return entry.type === "background";
    if (category === "components") return entry.type === "component";
    return true;
  })) {
    console.log(`  ${item.name.padEnd(18)} ${(item.category ?? `${item.type}s`).padEnd(12)} ${item.description}`);
  }
}

async function doctor(cwd) {
  const checks = [];
  const packagePath = path.join(cwd, "package.json");
  checks.push(["package.json", await exists(packagePath)]);
  checks.push([CONFIG_FILE, await exists(path.join(cwd, CONFIG_FILE))]);

  if (checks[1][1]) {
    const config = await loadConfig(cwd);
    checks.push([`Theme: ${formatTheme(config.theme)}`, true]);
    checks.push([config.paths.styles, await exists(path.join(cwd, config.paths.styles))]);
    checks.push(["Theme tokens", await exists(path.join(cwd, path.dirname(config.paths.styles), "quack-theme.css"))]);
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
  quackelements init [--theme default|monochrome] [--language tsx|jsx] [--force]
  quackelements create [name] [--template next|vite] [--language tsx|jsx]
    [--theme default|monochrome] [--install foundation|recommended|all] [--yes]
  quackelements add <component...> [--overwrite]
  quackelements add --all [--overwrite]
  quackelements add --category components|backgrounds [--overwrite]
  quackelements list [--category components|backgrounds]
  quackelements doctor

Aliases:
  quackelements, qe`);
}
