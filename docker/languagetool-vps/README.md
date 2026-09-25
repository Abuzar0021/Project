# LanguageTool checker (VPS)

Runs LanguageTool on your own server, reachable over HTTPS at a subdomain and
only by a caller that sends a shared secret. Vercel's `/api/check` route sends
that secret (server-side, via the `LANGUAGETOOL_SECRET` env var); the public
cannot reach the checker.

Pick the setup that matches your server:

- **Standalone** (`docker-compose.yml`): the VPS has nothing on ports 80/443.
  This runs LanguageTool plus its own Caddy that handles HTTPS and the secret.
- **Behind an existing proxy** (`docker-compose.behind-proxy.yml`): the VPS
  already runs a reverse proxy (Caddy, nginx, Traefik) on 80/443. This runs only
  LanguageTool and joins your proxy's network; you add one block to your proxy
  config (see `Caddyfile.snippet`).

In both, LanguageTool itself publishes no ports and is invisible to the public.

## Common first steps

1. Point DNS at the VPS: add an A record for your subdomain (for example
   `check.omnistacksdigital.com`) to the VPS public IP. Wait for it to resolve.
2. Generate a shared secret and keep it; you paste the same string into Vercel
   as `LANGUAGETOOL_SECRET`:

   ```
   openssl rand -hex 32
   ```

## Standalone setup

1. Open the firewall so Caddy can get a certificate:

   ```
   sudo ufw allow 80
   sudo ufw allow 443
   ```

2. Copy this folder to the VPS, create the `.env`, and fill in `CHECK_DOMAIN`
   and `CHECK_SHARED_SECRET`:

   ```
   cp .env.example .env
   ```

3. Start it (Caddy provisions the certificate on first request):

   ```
   docker compose up -d
   ```

## Behind an existing proxy

1. Find your proxy's Docker network name:

   ```
   docker inspect <proxy-container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
   ```

2. Copy this folder to the VPS, create the `.env`, and set `PROXY_NETWORK` to
   that network name:

   ```
   cp .env.example .env
   ```

3. Start only LanguageTool, joined to the proxy network:

   ```
   docker compose -f docker-compose.behind-proxy.yml up -d
   ```

4. Add the block in `Caddyfile.snippet` to your existing Caddyfile (replace the
   domain and secret), then reload your proxy:

   ```
   docker exec <proxy-container> caddy reload --config /etc/caddy/Caddyfile
   ```

   Back up your Caddyfile first, and `caddy validate` before reloading so a typo
   cannot take your other sites down.

## Confirm it works from the public internet

Replace the domain and secret with yours.

Returns JSON (the supported languages):

```
curl -H "X-Check-Secret: YOUR_SECRET" https://check.omnistacksdigital.com/v2/languages
```

Returns `Not found` with a 404 (proves it is locked down):

```
curl -i https://check.omnistacksdigital.com/v2/languages
```

A real check request:

```
curl -H "X-Check-Secret: YOUR_SECRET" \
  --data-urlencode "text=This are a test." \
  --data-urlencode "language=en-US" \
  https://check.omnistacksdigital.com/v2/check
```

## Then point Vercel at it

In the Vercel project settings, for Production and Preview:

- `LANGUAGETOOL_URL` = `https://check.omnistacksdigital.com` (no trailing slash)
- `LANGUAGETOOL_SECRET` = the same string as your shared secret

Redeploy so the new values take effect.

## Notes

- LanguageTool loads its models for a few minutes on boot. The healthcheck's
  `start_period` covers that, so a slow start shows `starting`, not `unhealthy`.
- To improve suggestion quality you can add n-gram data later; it needs several
  GB of disk and a volume mount. Not required to run.
- Pin the image tag (for example `erikvl87/languagetool:6.8`) once you settle on
  a version, instead of `latest`, so restarts are reproducible.
