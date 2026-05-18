DROP INDEX IF EXISTS `unique_student_register_no_idx`;--> statement-breakpoint
CREATE TABLE `__new_students` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`class_id` text NOT NULL,
	`section_id` text NOT NULL,
	`school_register_no` text NOT NULL,
	`roll_number` integer NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text,
	`full_name` text NOT NULL,
	`gender` text NOT NULL,
	`dob` text NOT NULL,
	`phone` text NOT NULL,
	`father_name` text NOT NULL,
	`mother_name` text,
	`aadhar_no` text,
	`aadhar_verification_status` text,
	`admission_date` text,
	`photo_url` text,
	`photo_file_id` text,
	`status` text DEFAULT 'active',
	`created_at` integer NOT NULL
);--> statement-breakpoint
INSERT INTO `__new_students` (
	`id`,
	`school_id`,
	`class_id`,
	`section_id`,
	`school_register_no`,
	`roll_number`,
	`first_name`,
	`last_name`,
	`full_name`,
	`gender`,
	`dob`,
	`phone`,
	`father_name`,
	`mother_name`,
	`status`,
	`created_at`
)
SELECT
	`id`,
	`school_id`,
	`class_id`,
	`section_id`,
	`id`,
	`roll_number`,
	COALESCE(NULLIF(`full_name`, ''), 'Student'),
	NULL,
	COALESCE(NULLIF(`full_name`, ''), 'Student'),
	COALESCE(NULLIF(`gender`, ''), 'Other'),
	'01/01/2000',
	COALESCE(NULLIF(`phone`, ''), 'N/A'),
	COALESCE(NULLIF(`father_name`, ''), 'N/A'),
	`mother_name`,
	COALESCE(`status`, 'active'),
	`created_at`
FROM `students`;--> statement-breakpoint
DROP TABLE `students`;--> statement-breakpoint
ALTER TABLE `__new_students` RENAME TO `students`;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_student_register_no_idx` ON `students` (`school_id`,`school_register_no`);
