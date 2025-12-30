import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  console.log("⏳ Running migrations...");

  const connection = postgres(databaseUrl, { max: 1 });
  const db = drizzle(connection);

  await migrate(db, { migrationsFolder: "drizzle" });

  await connection.end();

  console.log("✅ Migrations completed successfully");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Migration failed");
  console.error(error);
  process.exit(1);
});
