# Optional shared Clouds infrastructure

See [the feature guide](../../docs/INTO-THE-CLOUDS.md). The existing API adapter and migration are ready for a SQLite/D1-compatible DB. All hosted writes stay disabled without `CLOUDS_ENABLED=true`. No new paid API, external service, cloud resource or deployment is provisioned here.

For a free local shared test, run `npm start` and open two tabs at the printed localhost address. The current Wi-Fi companion relay remains limited to pairing; it does not expose the anonymous public API or authenticated account APIs. GitHub Pages uses local demo storage until a separately approved backend is configured.
