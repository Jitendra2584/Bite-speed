import { DataSource } from "typeorm";
import { Contacts } from "./entity/contacts";
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT) || 5555,
  username: process.env.DB_USER ?? "your_pg_username",
  password: process.env.DB_PASSWORD ?? "your_pg_password",
  database: process.env.DB_NAME ?? "bites_peed_identity",
  synchronize: true,
  logging: false,
  entities: [Contacts],
  extra:{
    connectionLimit: 10, // Optional: Set a connection limit for the pool
    idleTimeoutMillis: 30000,
  }
});