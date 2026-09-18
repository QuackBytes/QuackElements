# QuackElements

[QuackElements](https://github.com/QuackBytes/QuackElements) is an open-source React component source installer by [QuackBytes](https://quackbytes.com) and [Sezer Alaca](https://sezeralaca.dev). It installs readable, editable component code directly into your application so teams can keep a consistent foundation without giving up source ownership.

> **Alpha:** The command surface and generated source may change before the first stable release. Pin the package version in production projects.

## Requirements

- Node.js 20 or newer
- React 19 or newer
- Tailwind CSS 4
- A TypeScript path alias for `@/*`

## Install

```bash
npm install --save-dev quackelements@alpha
npx quackelements init
npx quackelements add button
```

`init` asks you to choose a color theme:

- **Default** — warm yellow with restrained orange accents.
- **Monochrome** — black, gray, and off-white.

For CI or scripted setup, pass the selection directly:

```bash
npx quackelements init --theme default
npx quackelements init --theme monochrome
```

Install the complete component catalog when you need it:

```bash
npx quackelements add --all
```

Import the generated token stylesheet once in the application entry file:

```ts
import "./styles/quack-elements.css";
```

Then import the generated component:

```tsx
import { Button } from "@/components/quack/button";

export function SaveAction() {
  return <Button>Save</Button>;
}
```

You can also use the short executable: `npx qe add button`.

## Commands

```text
quackelements init [--theme default|monochrome] [--force]
quackelements add <component...> [--overwrite]
quackelements add --all [--overwrite]
quackelements list
quackelements doctor
```

Project paths and the selected theme are controlled by the generated `quackelements.json` file. Theme tokens are installed into `src/styles/quack-theme.css`, so teams can tune the selected palette without editing component source.

Generated components can depend on packages such as Base UI, Lucide and date-fns. Installing QuackElements installs the catalog's declared dependencies; the generated component files themselves remain in your repository and are yours to edit.

### Why Base UI?

Base UI supplies unstyled accessibility and interaction primitives for complex controls such as dialogs, menus, tabs, and comboboxes. QuackElements owns the visual language, semantic tokens, generated component API, and CLI workflow. This keeps keyboard and screen-reader behavior dependable without importing another product's design system.

## Component workbench

The `workbench` application contains the complete editable QuackElements component source. After changing components there, rebuild the package registry:

```bash
npm --prefix workbench run dev
npm run sync
npm run workbench:build
```

## Ownership and attribution

QuackElements is maintained by QuackBytes and Sezer Alaca and released under the MIT License. The initial component catalog was derived from MIT-licensed open-source work, including shadcn/ui. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for the retained notices and terms.

## Development

```bash
npm run check
npm test
npm run workbench:build
npm pack --dry-run
```

Development guidance is available in [CONTRIBUTING.md](./CONTRIBUTING.md) and [docs/architecture.md](./docs/architecture.md).
