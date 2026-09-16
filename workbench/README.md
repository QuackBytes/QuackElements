# QuackElements workbench

This private development application previews the complete QuackElements catalog. Component source in `src/components/quack` is the source of truth used to generate the package registry.

```bash
npm install
npm run dev
```

After changing a component, run `npm run sync` from the repository root and commit both the workbench source and generated registry output.
