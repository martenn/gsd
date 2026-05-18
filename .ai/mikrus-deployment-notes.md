# Mikrus Deployment Notes

**Version:** 1.1
**Last Updated:** 2026-05-18
**Status:** Captured from pesel-birth-date deployment to `artur131.mikrus.xyz`
**Applies to:** GSD deployment to the same host

This document captures server-specific quirks discovered while deploying a sibling project to the target Mikrus VPS. The lessons transfer to GSD because the *exposure* model (mikrus panel subdomain → local port, with mikrus terminating TLS) is identical, even though GSD's image distribution differs (GHCR pull vs local build).

---

## Target Server Profile

- **Host:** `artur131.mikrus.xyz` (custom SSH port)
- **Type:** LXC/OpenVZ container (not full VM)
- **Kernel:** Restricted — most `/proc/sys` paths are read-only
- **Networking:** IPv6-primary; IPv4 NAT'd
- **Docker:** Installed, but constrained by the kernel restrictions above
- **External exposure:** Mikrus admin panel maps `artur131.mikrus.xyz/<subpath>` (or a configured subdomain) → local TCP port

---

## Critical Gotchas

### 1. Docker bridge networking fails

**Symptom (container init):**
```
runc create failed: ... open sysctl net.ipv4.ip_unprivileged_port_start file:
reopen fd 8: permission denied
```

**Cause:** Docker 25+ tries to write `net.ipv4.ip_unprivileged_port_start=0` into the container's network namespace on every container start. LXC blocks sysctl writes.

**Fix:** Use `network_mode: host` in `docker-compose.yml`. Container shares the host network namespace — no new namespace, no sysctl writes.

**Consequence for GSD:** every service that currently relies on the Docker bridge needs adjustment. Specifically:
- `nginx-proxy` service: drop `ports:` mapping, configure nginx to `listen <port>` directly
- `backend` and `frontend` services: they reach each other via `localhost:<port>` (since they all share the host net), **not** via service-name DNS (which only works inside the bridge)
- `postgres`: bind to `127.0.0.1:5432` on the host, backend talks to `127.0.0.1:5432`
- All inter-service port collisions must be resolved at the host level

This is a non-trivial change to the existing `docker-compose.yml`. Re-evaluate whether to:
- (a) keep bridge networking and find a way to suppress the sysctl write (unclear if possible without kernel changes)
- (b) restructure for host networking
- (c) deploy GSD to a different host that supports full Docker

### 2. iptables `DOCKER-FORWARD` chain missing

**Symptom (network create):**
```
Failed to Setup IP tables: ... iptables --wait -t filter -A DOCKER-FORWARD ...:
No chain/target/match by that name. (exit status 1)
```

**Cause:** Docker daemon's iptables state out of sync with kernel — happens after package updates or kernel module reloads.

**Fix:** `systemctl restart docker`. Restores the chains. Recurs occasionally — worth knowing for the runbook.

### 3. Privileged ports (<1024) inside containers

Container processes cannot bind ports below 1024 inside the container's net namespace under LXC restrictions. Standard `nginx:alpine` (binds 80) fails even before the sysctl issue surfaces.

**Fix:** use `nginxinc/nginx-unprivileged:alpine` (runs as UID 101, listens on 8080 by default). For GSD's `nginx-proxy` service, swap the base image.

### 4. IPv6 binding is NOT automatic

Nginx default `listen <port>;` binds IPv4 only. The mikrus reverse proxy may connect via `[::1]:<port>` — IPv4-only nginx returns connection refused, surfacing as a 502 at the edge.

**Fix:** add explicit IPv6 listener:
```nginx
server {
    listen 8081;
    listen [::]:8081;
    ...
}
```

Verify on the host: `ss -tlnp | grep <port>` should show both `0.0.0.0:<port>` and `[::]:<port>`.

### 5. TLS termination & domain attachment

**Flow:** `getsd.bieda.it` → mikrus edge (handles DNS, TLS termination, virtual host) → local host port.

- Mikrus admin panel attaches the domain and provisions the certificate. **No Cloudflare in the path** for this project.
- Application sees plain HTTP from the mikrus edge proxy with `X-Forwarded-Proto: https` headers.
- nginx `set_real_ip_from 0.0.0.0/0` accepts those headers because the mikrus edge is the only host reaching local port 8080 (UFW enforces this).

### 6. Port allocation across projects on this host

| Project | Host port | Notes |
|---------|-----------|-------|
| pesel-birth-date | 8081 | static nginx |
| gsd | 8080 (proposed) | matches existing `docker-compose.yml` |

If GSD adopts host networking, **every** service's port must be unique on the host. Pick now:
- `nginx-proxy`: 8080
- `postgres`: 5432 (only bind to 127.0.0.1, do not expose to the public)
- `backend`: internal port (3000) — only reached by `localhost:3000` from nginx, do not expose
- `frontend`: internal port — same constraint

---

## What Transfers From `DEPLOYMENT.md` Unchanged

- Server prep (Docker install, UFW, SSH hardening) ✅
- `.env` setup pattern, secret generation ✅
- Backup cron, health-check scripts ✅
- Google OAuth callback URL setup ✅
- DB migration step (`prisma migrate deploy`) ✅

## What Needs Revision

- `docker-compose.yml` — likely full restructure for host networking (see Gotcha #1)
- `nginx/conf.d/gsd.conf` — add IPv6 `listen` lines
- `nginx-proxy` service — switch to `nginx-unprivileged` base image
- `DEPLOYMENT.md` Prerequisites — add mikrus-specific bullets, link this doc

---

## Recommended Pre-Deployment Validation

Before pushing GSD to mikrus, dry-run on a local Linux VM (or Lima/Multipass on macOS) configured to mimic the LXC restrictions:
- Disable kernel modules `br_netfilter`, `iptable_filter` if possible
- Mount `/proc/sys/net` read-only

If GSD's compose stack works under these constraints locally, it will work on mikrus.

---

## Open Questions for GSD-on-Mikrus

1. **Can postgres run in a host-net container with safe isolation?** It must bind only to `127.0.0.1` to avoid public exposure.
2. **Service discovery between backend/frontend without docker DNS?** With host networking, use `localhost:<port>` everywhere — but this requires every internal port to be unique and known.
3. **Resource limits.** Mikrus tier may have low RAM/CPU. Verify postgres + backend + frontend + nginx fit within plan limits before deploying.
4. **Alternative: deploy GSD elsewhere.** If host-networking refactor is too invasive, consider a small VPS with full virtualization (Hetzner CX11, DO basic droplet) and use mikrus only for static/small projects.

---

## See Also

- `DEPLOYMENT.md` — the general GSD deployment guide (host-agnostic)
- `.ai/deployment-strategies.md` — CI/CD options (image build, auto-deploy)
- `DOCKER-HUB-SETUP.md` — registry setup (still relevant; GHCR/Docker Hub flow unchanged)
