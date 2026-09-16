# Contributing to QuackElements

QuackElements is an open-source project maintained by QuackBytes and Sezer Alaca. Issues and focused pull requests are welcome.

## Local development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm --prefix workbench install
npm run verify
```

Run the catalog locally with `npm --prefix workbench run dev`.

## Component changes

1. Edit component source in `workbench/src/components/quack`.
2. Keep public APIs accessible, typed and composable.
3. Run `npm run sync` to rebuild the registry.
4. Run `npm run verify` before opening a pull request.
5. Commit the workbench source and generated registry changes together.

## Licensing

Contributions are accepted under the repository's MIT License. Preserve required third-party notices when adapting upstream work.
