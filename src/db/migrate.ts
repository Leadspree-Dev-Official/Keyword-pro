import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import postgres, { type Sql } from 'postgres';
import { computeDatabaseSsl } from '@/lib/runtime-environment';

type MigrationDefinition = {
  id: string;
  file: string;
};

const MIGRATIONS: MigrationDefinition[] = [
  {
    id: '0001_keyword_pro_compatibility_bridge',
    file: fileURLToPath(
      new URL(
        './migrations/0001_keyword_pro_compatibility_bridge.sql',
        import.meta.url,
      ),
    ),
  },
  {
    id: '0002_add_seranking_credentials',
    file: fileURLToPath(
      new URL(
        './migrations/0002_add_seranking_credentials.sql',
        import.meta.url,
      ),
    ),
  },
];

export type DatabaseMigrationResult = {
  applied: boolean;
  checksum: string;
  id: string;
};

type MigrationOptions = {
  databaseUrl?: string;
  env?: Record<string, string | undefined>;
  sql?: Sql;
};

function requiredDatabaseUrl(options: MigrationOptions): string {
  const value = options.databaseUrl ?? options.env?.DATABASE_URL;
  if (!value?.trim()) {
    throw new Error('DATABASE_URL is required to migrate Keyword Pro.');
  }
  return value;
}

export async function migrateDatabase(
  options: MigrationOptions = { env: process.env },
): Promise<DatabaseMigrationResult> {
  const ownClient = !options.sql;
  const env = options.env ?? process.env;
  const sql =
    options.sql ??
    postgres(requiredDatabaseUrl(options), {
      max: 1,
      onnotice: () => undefined,
      prepare: false,
      ssl: computeDatabaseSsl(env),
    });

  try {
    return await sql.begin(async (transaction) => {
      await transaction`select pg_advisory_xact_lock(hashtext('keyword-pro:migrations'))`;
      await transaction.unsafe(`
        CREATE TABLE IF NOT EXISTS public.keyword_pro_schema_migrations (
          id text PRIMARY KEY,
          checksum text NOT NULL,
          applied_at timestamp NOT NULL DEFAULT now()
        )
      `);

      let anyApplied = false;
      let lastId = MIGRATIONS[MIGRATIONS.length - 1].id;
      let lastChecksum = '';

      for (const migration of MIGRATIONS) {
        const migrationSql = readFileSync(migration.file, 'utf8');
        const checksum = createHash('sha256').update(migrationSql).digest('hex');
        lastId = migration.id;
        lastChecksum = checksum;

        const existing = await transaction<
          Array<{ checksum: string }>
        >`select checksum from public.keyword_pro_schema_migrations where id = ${migration.id}`;

        if (existing[0]) {
          if (existing[0].checksum !== checksum) {
            throw new Error(
              `Migration ${migration.id} was modified after it was applied.`,
            );
          }
          continue;
        }

        await transaction.unsafe(migrationSql);

        await transaction`
          insert into public.keyword_pro_schema_migrations (id, checksum)
          values (${migration.id}, ${checksum})
        `;
        anyApplied = true;
      }

      return {
        applied: anyApplied,
        checksum: lastChecksum,
        id: lastId,
      };
    });
  } finally {
    if (ownClient) {
      await sql.end({ timeout: 5 });
    }
  }
}
