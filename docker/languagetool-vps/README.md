# LanguageTool checker (VPS)

Runs LanguageTool on your VPS behind Caddy, reachable over HTTPS at your
subdomain and only by a caller that sends the shared secret. Vercel's
`/api/check` route sends that secret; the public cannot reach the checker.

## What runs here

- `languagetool`: the checker. Not published to the host or the internet.
- `caddy`: HTTPS gateway. Gets a certificate automatically, checks the secret,
  and forwards only `/v2/check` and `/v2/languages`. Everything else is 404.

## One-time setup

1. Point DNS at the VPS: add an A record for `check.omnistacksdigital.com`
   (or your chosen subdomain) to the VPS public IP. Wait for it to resolve.

2. Open the firewall for HTTP and HTTPS so Caddy can get a certificate:

   ```
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. Copy this folder to the VPS, then create the `.env`:

   ```
   cp .env.example .env
   ```

4. Generate a secret and put it in `.env` as `CHECK_SHARED_SECRET`, and set
   `CHECK_DOMAIN` to your subdomain:

   ```
   openssl rand -hex 32
   ```

   Keep this value. You will paste the same string into Vercel as
   `LANGUAGETOOL_SECRET`.

5. Start it:

   ```
   docker compose up -d
   ```

   Caddy provisions the certificate on first request; give it a minute.

## Confirm it works from the public internet

Replace the domain and secret with yours.

Should return JSON (the supported languages):

```
curl -H "X-Check-Secret: YOUR_SECRET" https://check.omnistacksdigital.com/v2/languages
```

Should return `Not found` with a 404 (proves it is locked down):

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

## Useful commands

```
docker compose logs -f caddy          # watch certificate and request logs
docker compose logs -f languagetool   # watch the checker
docker compose restart caddy          # after editing the Caddyfile
docker compose down                   # stop everything
```

## Notes

- To improve suggestion quality you can add n-gram data later; it needs several
  GB of disk and a volume mount. Not required to run.
- Pin the image tag (for example `erikvl87/languagetool:6.6`) once you settle on
  a version, instead of `latest`, so restarts are reproducible.
