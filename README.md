# fleet-insights

A small fleet analytics library and CLI. It is the **sandbox repository for the tb.lx PDLC factory**: the factory picks up Jira tickets, works on this code in a sandbox, and opens draft pull requests here. Nothing here is production code.

```sh
npm install           # fetches fleet-api from GitHub
npm test              # unit tests (node --test)
npm run report        # summary over data/sample-trips.json
```

## Depends on fleet-api

The data contract (`Vehicle`, `Trip`) and the input parsers come from [`fleet-api`](https://github.com/moraisjose/tblx-factory-sandbox-api), declared as a GitHub dependency with no lockfile, so `npm install` takes its `main`. A ticket can therefore need changes in both repositories.

## What it does

- Fuel consumption (l/100 km) and driving hours per vehicle.
- Km left to the next service, and which vehicles are due within a margin.

## Ideas for test tickets

Small, well-scoped changes to try the factory on:

- Add a `--margin` option to the CLI for the service-due report.
- Report CO₂ per vehicle from fuel used (2.64 kg CO₂ per litre of diesel).
- Treat electric vehicles (`fuelLitres` always 0) separately in the consumption report instead of showing 0 l/100km.
- Add average speed per vehicle.

## Branch rules

`main` is protected. The factory pushes only to `factory/*` branches and opens draft pull requests; people review and merge.
