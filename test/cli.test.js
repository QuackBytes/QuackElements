import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { run } from "../src/cli.js";

test("initializes a project and installs the button source", async () => {
  const project = await mkdtemp(path.join(os.tmpdir(), "quackelements-"));

  try {
    await writeFile(
      path.join(project, "package.json"),
      JSON.stringify({ name: "fixture", dependencies: { react: "latest" } }),
      "utf8"
    );

    await run(["init"], { cwd: project });
    await run(["add", "button"], { cwd: project });

    const config = JSON.parse(await readFile(path.join(project, "quackelements.json"), "utf8"));
    const button = await readFile(path.join(project, config.paths.components, "button.tsx"), "utf8");
    const styles = await readFile(path.join(project, config.paths.styles), "utf8");

    assert.match(button, /function Button/);
    assert.match(button, /@\/lib\/quack-elements/);
    assert.match(button, /data-qe-slot="button"/);
    assert.match(styles, /quack-tailwind\.css/);
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});

test("installs transitive component and hook dependencies", async () => {
  const project = await mkdtemp(path.join(os.tmpdir(), "quackelements-"));

  try {
    await writeFile(path.join(project, "package.json"), JSON.stringify({ name: "fixture" }), "utf8");
    await run(["init"], { cwd: project });
    await run(["add", "sidebar"], { cwd: project });

    assert.equal(await fileExists(path.join(project, "src/components/quack/button.tsx")), true);
    assert.equal(await fileExists(path.join(project, "src/components/quack/sidebar.tsx")), true);
    assert.equal(await fileExists(path.join(project, "src/hooks/use-mobile.ts")), true);
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});

async function fileExists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

test("keeps locally edited component files unless overwrite is requested", async () => {
  const project = await mkdtemp(path.join(os.tmpdir(), "quackelements-"));

  try {
    await writeFile(path.join(project, "package.json"), JSON.stringify({ name: "fixture" }), "utf8");
    await run(["init"], { cwd: project });
    await run(["add", "button"], { cwd: project });

    const buttonPath = path.join(project, "src/components/quack/button.tsx");
    await writeFile(buttonPath, "// local edit\n", "utf8");
    await run(["add", "button"], { cwd: project });

    assert.equal(await readFile(buttonPath, "utf8"), "// local edit\n");
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});
