import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const vehicleStatusEnum = pgEnum("vehicle_status", ["disponible", "reservado", "vendido"]);

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  year: integer("year").notNull(),
  mileageKm: integer("mileage_km").notNull(),
  fuel: varchar("fuel", { length: 40 }).notNull(),
  transmission: varchar("transmission", { length: 40 }).notNull(),
  priceUsd: integer("price_usd").notNull(),
  imageUrl: text("image_url").notNull(),
  status: vehicleStatusEnum("status").notNull().default("disponible"),
  isFeatured: boolean("is_featured").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminLoginAttempts = pgTable("admin_login_attempts", {
  id: serial("id").primaryKey(),
  ip: varchar("ip", { length: 128 }).notNull().unique(),
  failedCount: integer("failed_count").notNull().default(0),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
