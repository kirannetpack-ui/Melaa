if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error('Turso credentials are required for the production migration');
}
const catalogOnly = process.argv.includes('--catalog-only');
if (!catalogOnly && (!process.env.MELAA_ADMIN_PASSWORD || process.env.MELAA_ADMIN_PASSWORD.length < 12)) {
  throw new Error('A non-empty, 12+ character MELAA_ADMIN_PASSWORD is required');
}
process.env.NODE_ENV = 'production';
process.env.MELAA_RUN_MIGRATIONS = '1';
process.env.MELAA_MIGRATE_ONLY = '1';
if (catalogOnly) process.env.MELAA_SKIP_ADMIN_SEED = '1';
await import('../server.js');
console.log(catalogOnly ? 'Melaa production catalog is ready; admin onboarding is still required.' : 'Melaa production schema, catalog and admin are ready.');
