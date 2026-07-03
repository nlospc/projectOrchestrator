# Deployment Guide

How to prepare an environment (macOS / Ubuntu / other Linux), install, and keep
PMO Orchestrator running persistently (systemd, Docker, or pm2).

The app is a single Node process: `node server/index.js` serves both the static
frontend and the `/api` routes. State is one SQLite file at `data/pmo.sqlite`
(plus its `-shm`/`-wal` siblings), created and seeded automatically on first
boot. There is no build step and no external service dependency.

**Configuration:** `PORT` (default `3000`) is the only environment variable.
The server listens on all interfaces.

---

## 1. Environment preparation

Requirement: **Node.js 20 LTS** (18+ works; the repo is developed on 20).
`better-sqlite3` is a native module — it normally downloads a prebuilt binary
for your platform during `npm install`, so build tools are only needed as a
fallback (noted per-OS below).

### Ubuntu / Debian

The distro `nodejs` package is often too old — use NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # v20.x

# Only if better-sqlite3 has to compile from source:
sudo apt-get install -y build-essential python3
```

### RHEL / CentOS / Rocky

```bash
sudo dnf module enable nodejs:20 -y
sudo dnf install nodejs -y
# Fallback build tools: sudo dnf groupinstall "Development Tools" -y && sudo dnf install python3 -y
```

### macOS

```bash
brew install node@20
# Fallback build tools (only if a source compile is triggered):
xcode-select --install
```

### Windows

Install Node 20 LTS from <https://nodejs.org> or `winget install OpenJS.NodeJS.LTS`.
For server use, prefer WSL2 + the Ubuntu instructions above (systemd works
inside WSL2 on recent Windows builds), or use Docker Desktop.

### Install & smoke test (all platforms)

```bash
git clone <repo-url> pmo-orchestrator
cd pmo-orchestrator
npm ci            # or: npm install
npm start         # PMO Orchestrator running at http://0.0.0.0:3000
```

First boot creates and seeds `data/pmo.sqlite`. Open `http://<host>:3000`.

---

## 2. Persistent running

Pick one. **systemd** is the recommended production setup on a Linux host;
**Docker** if you prefer containers; **pm2** for a quick cross-platform option
(including macOS).

### Option A — systemd (Ubuntu / Linux server)

A ready-made unit ships at [`deploy/pmo-orchestrator.service`](../deploy/pmo-orchestrator.service).

```bash
# 1. Put the app in place and create a service user
sudo mkdir -p /opt/pmo-orchestrator
sudo cp -r . /opt/pmo-orchestrator        # or git clone there
sudo useradd --system --home /opt/pmo-orchestrator --shell /usr/sbin/nologin pmo
cd /opt/pmo-orchestrator && sudo npm ci
sudo chown -R pmo:pmo /opt/pmo-orchestrator

# 2. Install and start the unit
sudo cp deploy/pmo-orchestrator.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now pmo-orchestrator

# 3. Verify / operate
systemctl status pmo-orchestrator
journalctl -u pmo-orchestrator -f         # logs
sudo systemctl restart pmo-orchestrator   # after an upgrade
```

Edit the unit if your paths differ: `ExecStart` must point at your `node`
binary (`which node` — nvm installs live under `~/.nvm/versions/...`), and
`WorkingDirectory`/`ReadWritePaths` at the checkout. The unit restarts the
process automatically on crash (`Restart=always`) and on boot.

### Option B — Docker / docker compose

`Dockerfile` and `docker-compose.yml` ship in the repo root. The SQLite store
is kept on a named volume so `docker compose down` / image upgrades don't lose
data.

```bash
docker compose up -d --build     # build + run, restart: unless-stopped
docker compose logs -f           # logs
docker compose down              # stop (volume pmo-data survives)
```

Plain Docker without compose:

```bash
docker build -t pmo-orchestrator .
docker run -d --name pmo --restart unless-stopped \
  -p 3000:3000 -v pmo-data:/app/data pmo-orchestrator
```

To use a host directory instead of a named volume, replace the volume with
`-v /srv/pmo/data:/app/data` and make it writable by uid 1000 (the `node`
user in the image): `sudo chown -R 1000:1000 /srv/pmo/data`.

### Option C — pm2 (cross-platform, incl. macOS)

```bash
npm install -g pm2
pm2 start server/index.js --name pmo-orchestrator
pm2 save              # remember the process list
pm2 startup           # prints the command to register boot autostart
                      # (launchd on macOS, systemd on Linux) — run what it prints
pm2 logs pmo-orchestrator
```

On macOS, `pm2 startup` registers a launchd agent, which is the simplest way
to get restart-on-reboot without writing a plist by hand.

---

## 3. Data persistence & backup

- The entire state is `data/pmo.sqlite` (WAL mode, so `-shm`/`-wal` files
  appear alongside while the server runs).
- **Backup** = copy the file. For a consistent copy while the server is
  running, use SQLite's backup command rather than `cp`:
  `sqlite3 data/pmo.sqlite ".backup /backups/pmo-$(date +%F).sqlite"`.
- **Reset to clean seed**: stop the server, then
  `rm -f data/pmo.sqlite data/pmo.sqlite-shm data/pmo.sqlite-wal` — next boot
  reseeds from `src/data/mock-data.js`.

## 4. Upgrades

```bash
# systemd / pm2
git pull && npm ci && sudo systemctl restart pmo-orchestrator   # or: pm2 restart pmo-orchestrator

# docker
git pull && docker compose up -d --build
```

Schema migrations in `server/migrations/*.sql` run automatically on boot, so
upgrading the code is enough — no manual DB step.
