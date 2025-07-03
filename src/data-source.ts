import { DataSource } from "typeorm";
import { Contacts } from "./entity/contacts";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  synchronize: false,
  logging: true,
  entities: [Contacts],
  ssl: true, // Enable SSL for secure connections
  extra: {
    connectionLimit: 10, // Optional: Set a connection limit for the pool
    idleTimeoutMillis: 30000,
    ssl: { rejectUnauthorized: false }
  },
});
