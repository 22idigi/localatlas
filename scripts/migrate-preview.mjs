import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "npx.cmd" : "npx";

function run(commandName, args) {
  const result = spawnSync(commandName, args, {
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const shouldMigrateProduction =
  process.env.VERCEL_ENV === "production" &&
  process.env.RUN_PRODUCTION_MIGRATIONS === "true";

if (shouldMigrateProduction) {
  console.log("Rehearsing reviewed migrations against Production with rollback.");
  run(process.execPath, ["scripts/rehearse-production-migration.mjs"]);

  if (existsSync("/tmp/11i-production-baseline-resolution-required")) {
    console.log("Recording the verified existing baseline schema in Prisma history.");
    run(command, [
      "prisma",
      "migrate",
      "resolve",
      "--applied",
      "20261026000100_initial_baseline",
    ]);
  }

  console.log("Applying reviewed Prisma migrations to the Production database.");
  run(command, ["prisma", "migrate", "deploy"]);
  process.exit(0);
}

const shouldMigrate =
  process.env.VERCEL_ENV === "preview" &&
  process.env.RUN_PREVIEW_MIGRATIONS === "true";

if (!shouldMigrate) {
  console.log("Preview database migration is disabled.");
  process.exit(0);
}

console.log("Applying reviewed Prisma migrations to the Preview database.");
run(command, ["prisma", "migrate", "deploy"]);
