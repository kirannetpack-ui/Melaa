import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@libsql/client';

const localPath = process.env.MELAA_DB_PATH || path.join(process.cwd(), 'data', 'melaa.sqlite');
const remote = Boolean(process.env.TURSO_DATABASE_URL);
const client = createClient({
  url: remote ? process.env.TURSO_DATABASE_URL : pathToFileURL(localPath).href,
  ...(remote ? { authToken: process.env.TURSO_AUTH_TOKEN } : {}),
  intMode: 'number'
});

const statement = sql => ({
  async get(...args) { return (await client.execute({ sql, args })).rows[0] || null; },
  async all(...args) { return (await client.execute({ sql, args })).rows; },
  async run(...args) {
    const result = await client.execute({ sql, args });
    return { lastInsertRowid: Number(result.lastInsertRowid || 0), changes: result.rowsAffected };
  }
});

export const db = {
  prepare: statement,
  exec: sql => client.executeMultiple(sql),
  async transaction(work) {
    const tx = await client.transaction('write');
    const transactional = {
      prepare: sql => ({
        async get(...args) { return (await tx.execute({ sql, args })).rows[0] || null; },
        async all(...args) { return (await tx.execute({ sql, args })).rows; },
        async run(...args) {
          const result = await tx.execute({ sql, args });
          return { lastInsertRowid: Number(result.lastInsertRowid || 0), changes: result.rowsAffected };
        }
      })
    };
    try { const result = await work(transactional); await tx.commit(); return result; }
    catch (error) { await tx.rollback(); throw error; }
  }
};
