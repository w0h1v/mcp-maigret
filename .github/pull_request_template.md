## Summary

<!-- What changes, and why. Link the issue if one applies. -->

## Checks

- [ ] `npm run build` passes
- [ ] Tried against a real maigret run (`docker run` through the server), not only a type check
- Tested with: <!-- tool, format, maigret version -->

## Checklist

- [ ] Any new or changed input is validated (see `isValidUsername`, `isValidUrl`, `isValidTag` in `src/index.ts`) and still reaches Docker through `execFile` with an argument array.
- [ ] No secrets, personal data or real people's usernames in code, docs, tests or this description.
- [ ] README and docs are updated where tools, parameters, formats or requirements changed.
- [ ] Changes to tool schemas or defaults are called out in the release notes.
