import { readFile, unlink, writeFile } from "node:fs/promises";
import { Client } from "pg";

const BASELINE_MIGRATION = "20261026000100_initial_baseline";
const TENANT_MIGRATION = "20261027000100_tenant_foundation";
const SEARCH_CONSOLE_MIGRATION = "20261029000100_search_console_connector";
const BASELINE_MARKER = "/tmp/11i-production-baseline-resolution-required";

const baselineTables = ["User", "Account", "Session", "VerificationToken", "Subscription", "Location", "MapPlatform", "Review", "Post", "Media"];
const tenantTables = ["Organization", "Membership", "AuditRun", "AuditFinding", "OptimizationTask", "ActivityLog"];
const searchConsoleTables = ["IntegrationConnection", "IntegrationOAuthState", "SearchConsoleProperty"];
const preservedTables = ["User", "Location", "Review", "Post", "Media"];

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function tableExists(client, table) {
  const result = await client.query(
    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = $1) AS exists",
    [table],
  );
  return result.rows[0]?.exists === true;
}

async function requireTables(client, tables, label) {
  const checks = await Promise.all(tables.map(async (table) => ({ table, exists: await tableExists(client, table) })));
  const missing = checks.filter(({ exists }) => !exists).map(({ table }) => table);
  if (missing.length > 0) throw new Error(`${label} is missing required tables: ${missing.join(", ")}`);
}

async function countRows(client, tables) {
  const counts = new Map();
  for (const table of tables) {
    const result = await client.query(`SELECT COUNT(*)::bigint AS count FROM ${quoteIdentifier(table)}`);
    counts.set(table, BigInt(result.rows[0].count));
  }
  return counts;
}

function assertCountsUnchanged(before, after) {
  for (const [table, count] of before) {
    if (after.get(table) !== count) throw new Error(`Migration rehearsal changed the ${table} row count.`);
  }
}

async function readMigrationNames(client) {
  if (!(await tableExists(client, "_prisma_migrations"))) return new Set();
  const result = await client.query(
    'SELECT "migration_name" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL',
  );
  return new Set(result.rows.map((row) => row.migration_name));
}

async function assertMigrationState(client, migrationNames, migration, tables) {
  const tableChecks = await Promise.all(tables.map((table) => tableExists(client, table)));
  const allExist = tableChecks.every(Boolean);
  const noneExist = tableChecks.every((exists) => !exists);
  const recorded = migrationNames.has(migration);

  if (recorded && !allExist) throw new Error(`${migration} is recorded but its schema is incomplete.`);
  if (!recorded && !noneExist) throw new Error(`${migration} is not recorded but some of its tables already exist.`);
  return { recorded };
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for the Production migration rehearsal.");

  await unlink(BASELINE_MARKER).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    application_name: "11i-production-migration-rehearsal",
  });
  await client.connect();
  let transactionOpen = false;

  try {
    await requireTables(client, baselineTables, "Production baseline");
    const migrationNames = await readMigrationNames(client);
    const tenantState = await assertMigrationState(client, migrationNames, TENANT_MIGRATION, tenantTables);
    const gscState = await assertMigrationState(client, migrationNames, SEARCH_CONSOLE_MIGRATION, searchConsoleTables);
    const beforeCounts = await countRows(client, preservedTables);

    await client.query("BEGIN");
    transactionOpen = true;

    if (!tenantState.recorded) {
      const tenantSql = await readFile("prisma/migrations/20261027000100_tenant_foundation/migration.sql", "utf8");
      await client.query(tenantSql);
    }
    if (!gscState.recorded) {
      const searchConsoleSql = await readFile("prisma/migrations/20261029000100_search_console_connector/migration.sql", "utf8");
      await client.query(searchConsoleSql);
    }

    await requireTables(client, [...tenantTables, ...searchConsoleTables], "Rehearsed schema");
    assertCountsUnchanged(beforeCounts, await countRows(client, preservedTables));

    const integrityResult = await client.query(
      'SELECT (SELECT COUNT(*) FROM "Location" WHERE "organizationId" IS NULL)::int AS locations_without_org, (SELECT COUNT(*) FROM "User")::int AS users, (SELECT COUNT(*) FROM "Membership" WHERE "status" = \'ACTIVE\')::int AS active_memberships',
    );
    const integrity = integrityResult.rows[0];
    if (integrity.locations_without_org !== 0) throw new Error("Migration rehearsal left locations without an organization.");
    if (integrity.active_memberships < integrity.users) throw new Error("Migration rehearsal did not create an active membership for every user.");

    await client.query("ROLLBACK");
    transactionOpen = false;

    if (!migrationNames.has(BASELINE_MIGRATION)) {
      await writeFile(BASELINE_MARKER, "verified-existing-baseline\n", { mode: 0o600 });
    }

    console.log("Production migration rehearsal rolled back successfully.");
    console.log("Verified baseline, tenant isolation, GSC schema, and preserved row counts.");
  } finally {
    if (transactionOpen) await client.query("ROLLBACK").catch(() => undefined);
    await client.end();
  }
}

main().catch((error) => {
  console.error("Production migration rehearsal failed:", error.message);
  process.exit(1);
});
