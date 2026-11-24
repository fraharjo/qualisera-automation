# Test data and security rules

- **Separate data from scenarios.** Never hardcode credentials, passwords or large static datasets in `.feature` files.
- **No state poisoning.** Never use a shared static account (e.g. a fixed locked-user credential) for destructive or lockout tests, because it poisons later CI runs. Use isolated dynamic users per test or an API reset/seed endpoint.
- **Reproducible data.** Avoid unseeded, unlogged random strings. Use reproducible prefixes with timestamps (e.g. `item_${Date.now()}`) or logged seeds.
- **Where things go.** Secrets, credentials and target URLs go to `.env` via `shared/config/env.config.ts`. Static catalogs and master data go to the fixtures location in the README (e.g. `shared/data/fixtures/<feature>.json`, only if that folder exists). Dynamic bulk data (unique emails, phone numbers, addresses) uses the data factory at `shared/data/data-factory.ts`.
- **Privacy.** Use RFC 2606 test domains (`@example.com`) and sandbox payment cards. Never print passwords to console logs.
- **Security scenarios** check that unusual input (markup, script-like strings, very long strings) is handled safely. Do not write exploit payloads.
