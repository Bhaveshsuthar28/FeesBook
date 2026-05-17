CREATE TABLE `sections` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`class_id` text NOT NULL,
	`name` text NOT NULL,
	`capacity` integer NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_section_idx` ON `sections` (`class_id`,`name`);