CREATE TABLE `shares` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE cascade
);
