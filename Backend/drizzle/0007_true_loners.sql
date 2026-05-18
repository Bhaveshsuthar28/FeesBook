CREATE TABLE `student_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`student_id` text NOT NULL,
	`student_fee_id` text NOT NULL,
	`fee_type_id` text NOT NULL,
	`amount` integer NOT NULL,
	`paid_at` integer NOT NULL,
	`note` text,
	`created_at` integer NOT NULL
);
