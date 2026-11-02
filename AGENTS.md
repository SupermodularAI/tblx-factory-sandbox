# Repository guidance

- TypeScript run directly by Node (>= 22.18, type stripping); no build step and no dependencies.
- `npm test` runs `node --test`. Every change keeps it green and adds a test for new behaviour.
- `src/fleet.ts` holds pure functions over `Vehicle` and `Trip` (`src/types.ts`); keep I/O in `src/cli.ts`.
- Distances are km, fuel is litres, times are ISO 8601 strings in UTC.
