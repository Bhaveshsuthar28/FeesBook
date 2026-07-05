CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`student_id` text NOT NULL,
	`academic_year` text NOT NULL,
	`class_id` text NOT NULL,
	`section_id` text NOT NULL,
	`roll_number` integer,
	`admission_type` text DEFAULT 'new' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`promoted_from` text,
	`note` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_school_student_year_idx` ON `enrollments` (`school_id`,`student_id`,`academic_year`);--> statement-breakpoint
CREATE INDEX `school_year_class_section_idx` ON `enrollments` (`school_id`,`academic_year`,`class_id`,`section_id`);--> statement-breakpoint
CREATE INDEX `school_student_idx` ON `enrollments` (`school_id`,`student_id`);--> statement-breakpoint
CREATE INDEX `idx_enrollments_student_id` ON `enrollments` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_enrollments_class_year` ON `enrollments` (`class_id`,`academic_year`);--> statement-breakpoint
CREATE INDEX `idx_enrollments_school_year` ON `enrollments` (`school_id`,`academic_year`);--> statement-breakpoint
CREATE INDEX `idx_enrollments_status` ON `enrollments` (`school_id`,`status`,`academic_year`);--> statement-breakpoint
CREATE TABLE `principal_bot_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`activation_command` text NOT NULL,
	`password_hash` text NOT NULL,
	`phone_number` text,
	`failed_attempts` integer DEFAULT 0,
	`locked_until` text,
	`is_active` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `principal_bot_credentials_school_id_unique` ON `principal_bot_credentials` (`school_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `principal_bot_credentials_activation_command_unique` ON `principal_bot_credentials` (`activation_command`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_activation_command` ON `principal_bot_credentials` (`activation_command`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_principal_bot_school` ON `principal_bot_credentials` (`school_id`);--> statement-breakpoint
CREATE TABLE `receipt_counters` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`academic_year` text NOT NULL,
	`last_sequence` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_receipt_counter_idx` ON `receipt_counters` (`school_id`,`academic_year`);--> statement-breakpoint
CREATE TABLE `student_fee_concessions` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`student_id` text NOT NULL,
	`academic_year` text NOT NULL,
	`concession_type` text NOT NULL,
	`basis` text NOT NULL,
	`basis_value` integer NOT NULL,
	`gross_amount` integer NOT NULL,
	`concession_amount` integer NOT NULL,
	`net_amount` integer NOT NULL,
	`remark` text,
	`receipt_no` text,
	`receipt_sequence` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `principals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clerk_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`photo` text,
	`school_name` text,
	`school_address` text,
	`city` text,
	`state` text,
	`district` text,
	`pin_code` text,
	`logo_url` text,
	`logo_file_id` text,
	`principal_signature_url` text,
	`principal_signature_file_id` text,
	`stamp_url` text,
	`stamp_file_id` text,
	`active_academic_year` text,
	`latitude` integer,
	`longitude` integer,
	`receipt_prefix` text,
	`receipt_qr` integer,
	`receipt_signature` integer,
	`receipt_stamp` integer,
	`receipt_footer` text,
	`payment_modes` text,
	`mobile` text,
	`language` text DEFAULT 'en',
	`is_profile_complete` integer DEFAULT false,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `principals_clerk_id_unique` ON `principals` (`clerk_id`);--> statement-breakpoint
CREATE INDEX `idx_principals_clerk_id` ON `principals` (`clerk_id`);--> statement-breakpoint
CREATE TABLE `bot_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`school_id` text,
	`current_step` text DEFAULT 'AUTH',
	`context` text,
	`authenticated` integer DEFAULT false,
	`expires_at` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bot_sessions_phone_unique` ON `bot_sessions` (`phone`);--> statement-breakpoint
CREATE TABLE `principal_bot_auth` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text,
	`phone` text NOT NULL,
	`secret_code` text NOT NULL,
	`failed_attempts` integer DEFAULT 0,
	`blocked_until` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text,
	`student_id` text,
	`recipient_phone` text NOT NULL,
	`message_type` text NOT NULL,
	`status` text DEFAULT 'PENDING',
	`wa_message_id` text,
	`error_reason` text,
	`sent_at` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `whatsapp_settings` (
	`school_id` text PRIMARY KEY NOT NULL,
	`reminder_interval_days` integer DEFAULT 90,
	`reminder_time` text DEFAULT '09:00',
	`auto_send_enabled` integer DEFAULT false,
	`templates` text DEFAULT '[]',
	`created_at` integer
);
--> statement-breakpoint
ALTER TABLE `fee_types` ADD `frequency` text DEFAULT 'Yearly';--> statement-breakpoint
ALTER TABLE `student_fees` ADD `class_id` text;--> statement-breakpoint
ALTER TABLE `student_fees` ADD `academic_year` text;--> statement-breakpoint
ALTER TABLE `student_fees` ADD `last_paid_date` integer;--> statement-breakpoint
ALTER TABLE `student_fees` ADD `next_reminder_date` integer;--> statement-breakpoint
ALTER TABLE `student_fees` ADD `gross_amount` integer;--> statement-breakpoint
ALTER TABLE `student_fees` ADD `concession_amount` integer DEFAULT 0;--> statement-breakpoint
CREATE INDEX `idx_student_fees_student_id` ON `student_fees` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_student_fees_school_academic` ON `student_fees` (`school_id`,`academic_year`);--> statement-breakpoint
CREATE INDEX `idx_student_fees_school_student` ON `student_fees` (`school_id`,`student_id`);--> statement-breakpoint
CREATE INDEX `idx_student_fees_status` ON `student_fees` (`school_id`,`status`);--> statement-breakpoint
ALTER TABLE `student_payments` ADD `payment_mode` text DEFAULT 'Cash';--> statement-breakpoint
ALTER TABLE `student_payments` ADD `receipt_no` text;--> statement-breakpoint
ALTER TABLE `student_payments` ADD `receipt_sequence` integer;--> statement-breakpoint
ALTER TABLE `student_payments` ADD `receipt_academic_year` text;--> statement-breakpoint
ALTER TABLE `student_payments` ADD `remark` text;--> statement-breakpoint
ALTER TABLE `student_payments` ADD `transaction_ref` text;--> statement-breakpoint
ALTER TABLE `student_payments` ADD `receipt_sent` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `student_payments` ADD `receipt_sent_at` integer;--> statement-breakpoint
CREATE INDEX `idx_student_payments_school_paid` ON `student_payments` (`school_id`,`paid_at`);--> statement-breakpoint
CREATE INDEX `idx_student_payments_student` ON `student_payments` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_student_payments_student_fee` ON `student_payments` (`student_fee_id`);--> statement-breakpoint
ALTER TABLE `students` ADD `last_academic_year` text;--> statement-breakpoint
ALTER TABLE `students` ADD `previous_class_id` text;--> statement-breakpoint
ALTER TABLE `students` ADD `previous_section_id` text;--> statement-breakpoint
ALTER TABLE `students` ADD `left_at` integer;--> statement-breakpoint
ALTER TABLE `students` ADD `alumni_at` integer;--> statement-breakpoint
ALTER TABLE `students` ADD `movement_note` text;--> statement-breakpoint
ALTER TABLE `students` ADD `current_enrollment_id` text;--> statement-breakpoint
CREATE INDEX `idx_students_class_section` ON `students` (`class_id`,`section_id`);--> statement-breakpoint
CREATE INDEX `idx_students_school_status` ON `students` (`school_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_students_section_id` ON `students` (`section_id`);