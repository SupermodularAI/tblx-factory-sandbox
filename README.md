# fleet-insights

A small fleet analytics library and CLI. It is the **sandbox repository for the tb.lx PDLC factory**: the factory picks up Jira tickets, works on this code in a sandbox, and opens draft pull requests here. Nothing here is production code.

```sh
npm test              # unit tests (node --test)
npm run report        # summary over data/sample-trips.json
node src/cli.ts --margin 5000 data/sample-trips.json   # service-due report with a 5000 km margin (default 1000)
```

## What it does

- Fuel consumption (l/100 km) and driving hours per vehicle.
- Km left to the next service, and which vehicles are due within a margin (`--margin <km>`, default 1000 km; accepted before or after the data file).

## Ideas for test tickets

Small, well-scoped changes to try the factory on:

- Report CO₂ per vehicle from fuel used (2.64 kg CO₂ per litre of diesel).
- Treat electric vehicles (`fuelLitres` always 0) separately in the consumption report instead of showing 0 l/100km.
- Validate the input file and print a clear error for a trip whose `endedAt` is before `startedAt`.
- Add average speed per vehicle.

## Branch rules

`main` is protected. The factory pushes only to `factory/*` branches and opens draft pull requests; people review and merge.
