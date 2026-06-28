CREATE INDEX IF NOT EXISTS `idx_student_fees_student_id` ON `student_fees` (`student_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_student_fees_school_academic` ON `student_fees` (`school_id`,`academic_year`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_student_fees_school_student` ON `student_fees` (`school_id`,`student_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_student_fees_status` ON `student_fees` (`school_id`,`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_enrollments_student_id` ON `enrollments` (`student_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_enrollments_class_year` ON `enrollments` (`class_id`,`academic_year`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_enrollments_school_year` ON `enrollments` (`school_id`,`academic_year`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_enrollments_status` ON `enrollments` (`school_id`,`status`,`academic_year`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_students_class_section` ON `students` (`class_id`,`section_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_students_school_status` ON `students` (`school_id`,`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_students_section_id` ON `students` (`section_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_student_payments_school_paid` ON `student_payments` (`school_id`,`paid_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_student_payments_student` ON `student_payments` (`student_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_student_payments_student_fee` ON `student_payments` (`student_fee_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_principals_clerk_id` ON `principals` (`clerk_id`);
