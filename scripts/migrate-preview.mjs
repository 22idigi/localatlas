import { spawnSync } from "node:child_process";

const shouldMigrate =
  process.env.VERCEL_ENV === "preview" &&
  process.env.RUN_PREVIEW_MIGRATIONS === "true";

if (!shouldMigrate) {
  console.log("Preview database migration is disabled.");
  process.exit(0);
}

console.log("Applying reviewed Prisma migrations to the Preview database.");
const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["prisma", "migrate", "deploy"], {
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
