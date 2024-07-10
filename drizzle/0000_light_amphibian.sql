CREATE TABLE `Newsletter` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text,
	`confirmed_at` text,
	`confirmation_key` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Newsletter_email_unique` ON `Newsletter` (`email`);