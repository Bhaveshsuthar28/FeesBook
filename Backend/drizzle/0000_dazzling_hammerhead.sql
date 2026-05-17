CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`sequence` integer NOT NULL,
	`academic_year` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_sequence_idx` ON `classes` (`school_id`,`academic_year`,`sequence`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_class_name_idx` ON `classes` (`school_id`,`academic_year`,`name`);