CREATE TYPE "public"."vehicle_status" AS ENUM('disponible', 'reservado', 'vendido');--> statement-breakpoint
CREATE TABLE "admin_login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" varchar(128) NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"blocked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_login_attempts_ip_unique" UNIQUE("ip")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"year" integer NOT NULL,
	"mileage_km" integer NOT NULL,
	"fuel" varchar(40) NOT NULL,
	"transmission" varchar(40) NOT NULL,
	"price_usd" integer NOT NULL,
	"image_url" text NOT NULL,
	"status" "vehicle_status" DEFAULT 'disponible' NOT NULL,
	"is_featured" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
