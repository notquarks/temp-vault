CREATE TABLE `file_keys` (
	`file_id` text PRIMARY KEY NOT NULL,
	`iv_file` text NOT NULL,
	`iv_name` text NOT NULL,
	`enc_key` text NOT NULL,
	`wrap_iv` text NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `files` ADD `filename` text;