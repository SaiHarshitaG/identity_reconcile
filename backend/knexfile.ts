import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: "./migrations",
      extension: "ts"
    }
  }
};

export default config;