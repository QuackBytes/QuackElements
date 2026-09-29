import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { exists } from "./config.js";

const SUPPORTED_PACKAGE_MANAGERS = new Set(["npm", "pnpm", "yarn", "bun"]);

export async function scaffoldProject({
  cwd,
  name,
  template,
  language,
  version,
  packageManager = detectPackageManager(),
  runCommand = runCommandInherit
}) {
  validateProjectName(name);
  validateTemplate(template);

  const target = path.resolve(cwd, name);
  const relativeTarget = path.relative(cwd, target);
  if (!relativeTarget || relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
    throw new Error("The new project must be created inside the current directory.");
  }

  if (await exists(target)) {
    const entries = await readdir(target);
    if (entries.length > 0) throw new Error(`Target directory is not empty: ${name}`);
  } else {
    await mkdir(target, { recursive: true });
  }

  const commands = buildScaffoldCommands({
    name,
    target,
    template,
    language,
    version,
    packageManager
  });

  for (const command of commands) {
    await runCommand(command.command, command.args, command.cwd);
  }

  if (template === "vite") await configureVite(target, language);
  return target;
}

export function buildScaffoldCommands({
  name,
  target,
  template,
  language,
  version,
  packageManager
}) {
  if (!SUPPORTED_PACKAGE_MANAGERS.has(packageManager)) packageManager = "npm";
  const typescript = language === "tsx";
  const packageSpec = `quackelements@${version}`;
  const nextFlags = [
    typescript ? "--ts" : "--js",
    "--tailwind",
    "--eslint",
    "--app",
    "--src-dir",
    "--import-alias",
    "@/*",
    `--use-${packageManager === "bun" ? "bun" : packageManager}`,
    "--yes"
  ];
  const viteTemplate = typescript ? "react-ts" : "react";

  if (packageManager === "pnpm") {
    return [
      template === "next"
        ? { command: "pnpm", args: ["create", "next-app@latest", name, ...nextFlags], cwd: path.dirname(target) }
        : { command: "pnpm", args: ["create", "vite@latest", name, "--template", viteTemplate], cwd: path.dirname(target) },
      ...(template === "vite" ? [{ command: "pnpm", args: ["install"], cwd: target }] : []),
      {
        command: "pnpm",
        args: ["add", "-D", packageSpec, ...(template === "vite" ? ["tailwindcss", "@tailwindcss/vite"] : [])],
        cwd: target
      }
    ];
  }

  if (packageManager === "yarn") {
    return [
      template === "next"
        ? { command: "yarn", args: ["create", "next-app", name, ...nextFlags], cwd: path.dirname(target) }
        : { command: "yarn", args: ["create", "vite", name, "--template", viteTemplate], cwd: path.dirname(target) },
      ...(template === "vite" ? [{ command: "yarn", args: ["install"], cwd: target }] : []),
      {
        command: "yarn",
        args: ["add", "-D", packageSpec, ...(template === "vite" ? ["tailwindcss", "@tailwindcss/vite"] : [])],
        cwd: target
      }
    ];
  }

  if (packageManager === "bun") {
    return [
      template === "next"
        ? { command: "bun", args: ["create", "next-app", name, ...nextFlags], cwd: path.dirname(target) }
        : { command: "bun", args: ["create", "vite", name, "--template", viteTemplate], cwd: path.dirname(target) },
      ...(template === "vite" ? [{ command: "bun", args: ["install"], cwd: target }] : []),
      {
        command: "bun",
        args: ["add", "-d", packageSpec, ...(template === "vite" ? ["tailwindcss", "@tailwindcss/vite"] : [])],
        cwd: target
      }
    ];
  }

  return [
    template === "next"
      ? { command: "npm", args: ["create", "next-app@latest", name, "--", ...nextFlags], cwd: path.dirname(target) }
      : { command: "npm", args: ["create", "vite@latest", name, "--", "--template", viteTemplate], cwd: path.dirname(target) },
    ...(template === "vite" ? [{ command: "npm", args: ["install"], cwd: target }] : []),
    {
      command: "npm",
      args: ["install", "--save-dev", packageSpec, ...(template === "vite" ? ["tailwindcss", "@tailwindcss/vite"] : [])],
      cwd: target
    }
  ];
}

export async function addFoundationImport(project, template) {
  const cssPath = template === "next"
    ? path.join(project, "src", "app", "globals.css")
    : path.join(project, "src", "index.css");
  const importLine = template === "next"
    ? '@import "../styles/quack-elements.css";'
    : '@import "./styles/quack-elements.css";';
  const current = (await exists(cssPath)) ? await readFile(cssPath, "utf8") : "";
  if (!current.includes(importLine)) {
    await writeFile(cssPath, `${current.trimEnd()}\n${importLine}\n`, "utf8");
  }
}

async function configureVite(project, language) {
  const extension = language === "tsx" ? "ts" : "js";
  const configPath = path.join(project, `vite.config.${extension}`);
  const config = `import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(root, "./src"),
    },
  },
})
`;
  await writeFile(configPath, config, "utf8");

  if (language === "tsx") {
    const tsconfigPath = path.join(project, "tsconfig.app.json");
    const current = await readFile(tsconfigPath, "utf8");
    if (!current.includes('"paths"')) {
      const updated = current.replace(
        /"compilerOptions"\s*:\s*\{/,
        '"compilerOptions": {\n    "baseUrl": ".",\n    "paths": { "@/*": ["./src/*"] },'
      );
      await writeFile(tsconfigPath, updated, "utf8");
    }
  } else {
    await writeFile(
      path.join(project, "jsconfig.json"),
      `${JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["./src/*"] } } }, null, 2)}\n`,
      "utf8"
    );
  }
}

function validateProjectName(name) {
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) {
    throw new Error("Project name must use lowercase letters, numbers, dots, dashes, or underscores.");
  }
}

function validateTemplate(template) {
  if (!new Set(["next", "vite"]).has(template)) {
    throw new Error('Unknown template. Choose one of: next, vite.');
  }
}

function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent ?? "npm";
  return userAgent.split("/")[0];
}

function runCommandInherit(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}.`));
    });
  });
}
