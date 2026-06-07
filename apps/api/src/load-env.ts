import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Load the monorepo-root .env so the API picks up shared config when run from
// `apps/api`. Existing process env always wins (override: false).
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), override: false });
