-- Apply this migration before deploying guest uploads.
ALTER TABLE `files` ADD `is_guest` integer NOT NULL DEFAULT 0;
ALTER TABLE `files` ADD `guest_access_hash` text;
ALTER TABLE `files` ADD `guest_ip_hash` text;

-- Guest rows retain the existing NOT NULL user_id foreign key by using a
-- reserved, non-login system principal. No account or session is created.
INSERT OR IGNORE INTO `user` (
  `id`, `name`, `username`, `display_username`, `email`, `email_verified`,
  `image`, `created_at`, `updated_at`
) VALUES (
  '__guest__', 'Guest uploads', NULL, NULL,
  'guest-system@arkivio.invalid', 0, NULL,
  unixepoch(), unixepoch()
);

CREATE TABLE `guest_upload_events` (
  `id` text PRIMARY KEY NOT NULL,
  `ip_hash` text NOT NULL,
  `challenge_hash` text NOT NULL,
  `size_bytes` integer NOT NULL DEFAULT 0,
  `status` text NOT NULL DEFAULT 'started',
  `created_at` integer NOT NULL
);
CREATE INDEX `guest_upload_events_ip_created_idx`
  ON `guest_upload_events` (`ip_hash`, `created_at`);
CREATE UNIQUE INDEX `guest_upload_events_challenge_idx`
  ON `guest_upload_events` (`challenge_hash`);
