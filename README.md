# fleet-insights

A small fleet analytics library and CLI. It is the **sandbox repository for the tb.lx PDLC factory**: the factory picks up Jira tickets, works on this code in a sandbox, and opens draft pull requests here. Nothing here is production code.

```sh
npm test              # unit tests (node --test)
npm run report        # summary over data/sample-trips.json
```

## What it does

- Fuel consumption (l/100 km) and driving hours per vehicle.
- Km left to the next service, and which vehicles are due within a margin.
- Driving hours per driver (trips without a driver count as "unassigned").

## Ideas for test tickets

Small, well-scoped changes to try the factory on:

- Add a `--margin` option to the CLI for the service-due report.
- Report CO₂ per vehicle from fuel used (2.64 kg CO₂ per litre of diesel).
- Treat electric vehicles (`fuelLitres` always 0) separately in the consumption report instead of showing 0 l/100km.
- Validate the input file and print a clear error for a trip whose `endedAt` is before `startedAt`.
- Add average speed per vehicle.

## Branch rules

`main` is protected. The factory pushes only to `factory/*` branches and opens draft pull requests; people review and merge.
