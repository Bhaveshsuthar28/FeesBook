ALTER TABLE `class_fees` ADD `is_archived` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_class_fee_idx` ON `class_fees` (`class_id`,`fee_type_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_fee_name_idx` ON `fee_types` (`school_id`,`name`);