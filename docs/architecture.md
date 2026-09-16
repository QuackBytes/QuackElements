# QuackElements architecture

## Product contract

QuackElements is a component source installer. Applications install the CLI, select components, and own the generated source files. The npm package also declares the third-party libraries used by the current catalog so generated components resolve immediately.

```text
npm install --save-dev quackelements
npx quackelements init
npx quackelements add button
```

The package name is lowercase because npm package names are lowercase. Component names are separate positional arguments to the `add` command.

## Product rules

- Public commands, configuration, generated paths and design tokens use the QuackElements namespace.
- Generated files use the `qe-` CSS and `--qe-` token namespaces.
- The installer uses only Node.js standard library APIs.
- Generated component source is readable, editable and committed to the consuming application.
- Third-party behavior primitives are explicit dependencies and do not define the QuackElements brand or CLI contract.
- Upstream-derived work retains its required license notice in `THIRD_PARTY_NOTICES.md`.

## Layers

1. Foundation: semantic tokens, themes, utilities, typography and motion.
2. Elements: focused controls such as Button, Input and Checkbox.
3. Compositions: reusable combinations such as Field and AlertDialog.
4. Patterns: application structures assembled by product teams.

Dependencies only point down the list. Domain-specific business behavior stays in applications.

## CLI boundary

The CLI owns:

- Configuration discovery and validation.
- Component discovery.
- Safe file installation.
- Local-change protection.
- Diagnostics.

The component source remains framework-readable and editable after installation. A future update command must present a diff before replacing local source.

## Versioning

- CLI releases follow semantic versioning.
- The config file has an independent numeric schema version.
- Components gain per-item versions before the first public beta.
- Breaking generated-source changes require a migration note or codemod.

## Near-term roadmap

### Alpha hardening

- Finalize company semantic tokens.
- Add component contract, accessibility and interaction tests.
- Test installation in clean Vite and Next.js fixtures.

### Beta delivery

- Add generated-source manifests and `diff` support.
- Document the behavior-primitive policy.
- Add browser interaction and focus-management tests.

### Stable release

- Publish the QuackElements documentation and component site.
- Add migration notes and a repeatable release process.
- Pilot the package in one production application.
