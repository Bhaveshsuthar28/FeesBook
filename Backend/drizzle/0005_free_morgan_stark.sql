CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`class_id` text NOT NULL,
	`section_id` text NOT NULL,
	`full_name` text NOT NULL,
	`roll_number` integer NOT NULL,
	`gender` text,
	`phone` text,
	`father_name` text,
	`mother_name` text,
	`status` text DEFAULT 'active',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `student_fees` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`student_id` text NOT NULL,
	`fee_type_id` text NOT NULL,
	`amount` integer NOT NULL,
	`paid_amount` integer DEFAULT 0,
	`due_amount` integer NOT NULL,
	`status` text DEFAULT 'pending',
	`created_at` integer NOT NULL
);
