import {
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "analyst", "viewer"]);
export const statusEnum = pgEnum("status", ["active", "inactive"]);

export const user = pgTable("user_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  password_hash: text("password_hash").notNull(),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  status: statusEnum("status").default("active"),
  role: roleEnum("role").default("viewer"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
]);

export const transaction = pgTable("transaction_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  description: text("description").notNull(),
  transaction_type: transactionTypeEnum("transaction_type").default("expense"),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date_of_transaction").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const refreshToken = pgTable("refresh_token_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull(),
  token_expiry: timestamp("token_expiry").notNull(),
  issued_at: timestamp("issued_at").defaultNow(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
