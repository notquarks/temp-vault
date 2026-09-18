ALTER TABLE `shares` ADD `capability_hash` text;
--> statement-breakpoint
ALTER TABLE `shares` ADD `expires_at` integer;
--> statement-breakpoint
ALTER TABLE `shares` ADD `revoked_at` integer;
--> statement-breakpoint
CREATE UNIQUE INDEX `shares_capability_hash_idx` ON `shares` (`capability_hash`);
