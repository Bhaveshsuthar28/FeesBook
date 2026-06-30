CREATE TABLE IF NOT EXISTS `principal_bot_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL UNIQUE,
	`activation_command` text NOT NULL UNIQUE,
	`password_hash` text NOT NULL,
	`phone_number` text,
	`failed_attempts` integer DEFAULT 0,
	`locked_until` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_activation_command` ON `principal_bot_credentials` (`activation_command`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_principal_bot_school` ON `principal_bot_credentials` (`school_id`);
