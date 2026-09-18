# Deployment and security notes

1. Copy `.env.example` to the runtime secret store. Set unique random values for
   `BETTER_AUTH_SECRET`, `MASTER_KEY`, `GUEST_SECURITY_SECRET`, and `CRON_SECRET`.
   Never commit `.env` or rotate existing credentials as part of a code deploy.
2. Apply Drizzle migrations, including `0007_share_capabilities.sql`, before
   deploying the API. New share URLs contain a short-lived capability token;
   old share rows must be recreated after migration.
3. Configure the CDN worker's `API_URL` and deploy `cdn-worker`. Decrypted
   responses are deliberately `private, no-store`; do not add public caching or
   wildcard CORS. Forward the guest access header when using guest files.
4. Set `TRUST_PROXY_HEADERS=true` only when the service is behind a trusted
   proxy that overwrites forwarding headers. Cloudflare deployments use
   `CF-Connecting-IP` automatically.
5. Schedule `/api/cron/cleanup` with `Authorization: Bearer $CRON_SECRET` daily.
   This removes expired files and stale guest reservations.
