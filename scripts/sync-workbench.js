import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const registryRoot = path.join(packageRoot, "registry")
const componentSource = path.join(packageRoot, "workbench", "src", "components", "quack")
const backgroundSource = path.join(componentSource, "backgrounds")
const hookSource = path.join(packageRoot, "workbench", "src", "hooks")
const foundationSource = path.join(packageRoot, "workbench", "src")

assertInsidePackage(registryRoot)

const previousManifest = JSON.parse(await readFile(path.join(registryRoot, "registry.json"), "utf8"))
for (const item of previousManifest.items ?? []) {
  const itemDirectory = path.join(registryRoot, item.name)
  assertInsidePackage(itemDirectory)
  await rm(itemDirectory, { recursive: true, force: true })
}

const componentFiles = (await readdir(componentSource))
  .filter((file) => file.endsWith(".tsx"))
  .sort()

const backgroundFiles = (await readdir(backgroundSource))
  .filter((file) => file.endsWith(".tsx"))
  .sort()

const items = []

for (const file of componentFiles) {
  const name = file.replace(/\.tsx$/, "")
  const content = await readFile(path.join(componentSource, file), "utf8")
  const dependencies = collectMatches(content, /@\/components\/quack\/([a-z0-9-]+)/g)
  const hookDependencies = collectMatches(content, /@\/hooks\/([a-z0-9-]+)/g)
  const itemDirectory = path.join(registryRoot, name)

  await mkdir(itemDirectory, { recursive: true })
  await writeFile(path.join(itemDirectory, file), content, "utf8")

  items.push({
    name,
    type: "component",
    description: `QuackElements ${toTitle(name)} component.`,
    dependencies: [...new Set([...dependencies, ...hookDependencies])].sort(),
    files: [{ source: file, target: file, targetRoot: "components" }],
  })
}

for (const file of backgroundFiles) {
  const name = file.replace(/\.tsx$/, "")
  const content = await readFile(path.join(backgroundSource, file), "utf8")
  const dependencies = collectMatches(content, /@\/components\/quack\/([a-z0-9-]+)/g)
  const hookDependencies = collectMatches(content, /@\/hooks\/([a-z0-9-]+)/g)
  const itemDirectory = path.join(registryRoot, name)

  await mkdir(itemDirectory, { recursive: true })
  await writeFile(path.join(itemDirectory, file), content, "utf8")

  items.push({
    name,
    type: "background",
    category: "backgrounds",
    description: `QuackElements ${toTitle(name)} animated background.`,
    dependencies: [...new Set([...dependencies, ...hookDependencies])].sort(),
    files: [{ source: file, target: `backgrounds/${file}`, targetRoot: "components" }],
  })
}

for (const file of (await readdir(hookSource)).filter((entry) => entry.endsWith(".ts")).sort()) {
  const name = file.replace(/\.ts$/, "")
  const itemDirectory = path.join(registryRoot, name)
  await mkdir(itemDirectory, { recursive: true })
  await writeFile(
    path.join(itemDirectory, file),
    await readFile(path.join(hookSource, file), "utf8"),
    "utf8"
  )

  items.push({
    name,
    type: "hook",
    description: `QuackElements ${toTitle(name)} hook.`,
    dependencies: [],
    files: [{ source: file, target: file, targetRoot: "hooks" }],
  })
}

const foundationRoot = path.join(registryRoot, "foundation")
await mkdir(foundationRoot, { recursive: true })

const theme = (await readFile(path.join(foundationSource, "index.css"), "utf8"))
  .replace('./styles/quack-tailwind.css', './quack-tailwind.css')
  .replace(
    '@import "./quack-tailwind.css";',
    '@import "./quack-tailwind.css";\n@import "./quack-theme.css";'
  )

await writeFile(path.join(foundationRoot, "quack-elements.css"), theme, "utf8")
await writeFile(
  path.join(foundationRoot, "quack-tailwind.css"),
  await readFile(path.join(foundationSource, "styles", "quack-tailwind.css"), "utf8"),
  "utf8"
)
await writeFile(
  path.join(foundationRoot, "quack-elements.ts"),
  await readFile(path.join(foundationSource, "lib", "quack-elements.ts"), "utf8"),
  "utf8"
)

const manifest = {
  name: "quackelements",
  version: 1,
  preset: "b2tqESkd9c",
  items: items.sort((left, right) => left.name.localeCompare(right.name)),
}

await writeFile(
  path.join(registryRoot, "registry.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8"
)

console.log(
  `Synced ${componentFiles.length} components and ${backgroundFiles.length} backgrounds into the QuackElements registry.`
)

function collectMatches(content, pattern) {
  return [...content.matchAll(pattern)].map((match) => match[1])
}

function toTitle(name) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function assertInsidePackage(target) {
  const relative = path.relative(packageRoot, target)
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Unsafe generated path: ${target}`)
  }
}
