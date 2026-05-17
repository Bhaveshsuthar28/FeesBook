CREATE TABLE `class_fees` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`class_id` text NOT NULL,
	`fee_type_id` text NOT NULL,
	`amount` integer NOT NULL,
	`is_default` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fee_types` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`default_amount` integer NOT NULL,
	`is_optional` integer DEFAULT false NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL
);
