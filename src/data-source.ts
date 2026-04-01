import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./models/User";
import { Transaction } from "./models/Transaction";
import { Category } from "./models/Category";
import dotenv from "dotenv";

dotenv.config();

const isTest = process.env.NODE_ENV === "test";
const dbPath = isTest
  ? process.env.TEST_DB_PATH || ":memory:"
  : process.env.DB_PATH || "./database.sqlite";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: true,
  logging: false,
  entities: [User, Transaction, Category],
  migrations: [],
  subscribers: []
});
