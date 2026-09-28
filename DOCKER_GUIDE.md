# The Complete Docker Guide & GymRetain Containerization Manual

This document is a comprehensive, production-grade guide covering:
1. **Docker Fundamentals** — Core concepts, architecture, and how containers actually work under the hood.
2. **Setting Up Docker in General** — Step-by-step instructions for Windows (WSL 2), macOS, and Linux.
3. **Running This Specific Project (GymRetain)** — Architecture, multi-stage Dockerfiles, database health checks, migrations, seeding, and everyday workflows.
4. **Operations & Troubleshooting Cheatsheet** — Real-world commands, debugging, and resolving common errors.

---

## Part 1: Docker Fundamentals (Under the Hood)

### 1.1 What Problem Does Docker Solve?
In traditional development, software runs directly on the host operating system. This leads to the infamous:
> *"It works on my machine, but it fails in staging or production!"*

Differences in operating systems, Node.js versions, installed libraries, system dependencies (like C++ compilers or OpenSSL), and environment variables make software fragile across different computers.

**Docker solves this by packaging the code, runtime, system libraries, configuration, and dependencies together into a standardized, isolated unit called a Container.**

---

### 1.2 Virtual Machines (VMs) vs. Docker Containers

| Feature | Virtual Machine (VM) | Docker Container |
|---|---|---|
| **Architecture** | Hypervisor runs a full **Guest OS** (GBs in size) | Runs directly on the **Host OS Kernel** |
| **Startup Time** | Minutes (boots full operating system) | Milliseconds to seconds (starts a process) |
| **Resource Usage** | Heavy (pre-allocates GBs of RAM and CPU) | Extremely lightweight (shares host kernel resources) |
| **Portability** | Heavy VM images (10GB–50GB) | Lightweight images (50MB–300MB) |
| **Isolation** | Hardware-level isolation | Kernel-level process isolation (Namespaces & Cgroups) |

```
+-----------------------------------+     +-----------------------------------+
|            Virtual Machine        |     |          Docker Container         |
+-----------------------------------+     +-----------------------------------+
|  App A    |  App B    |  App C    |     |  App A    |  App B    |  App C    |
|  Libs     |  Libs     |  Libs     |     |  Libs     |  Libs     |  Libs     |
+-----------+-----------+-----------+     +-----------+-----------+-----------+
| Guest OS  | Guest OS  | Guest OS  |     |           Docker Engine           |
+-----------+-----------+-----------+     +-----------------------------------+
|            Hypervisor             |     |          Host OS (Linux/WSL)      |
+-----------------------------------+     +-----------------------------------+
|          Host Hardware            |     |           Host Hardware           |
+-----------------------------------+     +-----------------------------------+
```

---

### 1.3 The Core Concepts

#### 1. Image (The Blueprint)
An **Image** is a read-only template containing instructions for creating a Docker container. Images are built from a `Dockerfile` and are composed of stacked, immutable layers.
- If layer 1 installs Node.js and layer 2 installs dependencies, modifying your application code only rebuilds layer 3. Layers 1 and 2 are retrieved instantly from the local build cache.

#### 2. Container (The Living Process)
A **Container** is a runnable, isolated instance of an image.
- When you run an image, Docker adds a thin, writable layer on top of the read-only image layers.
- Containers are isolated from each other and the host via Linux **Namespaces** (PID, NET, MNT, IPC, UTS) and resource-controlled by **Control Groups (cgroups)** (limiting CPU and memory).

#### 3. Dockerfile (The Recipe)
A plain text file containing sequential instructions to build a Docker image. Common instructions include:
- `FROM`: Specifies the base operating system / runtime image (e.g. `node:20-alpine`).
- `WORKDIR`: Sets the working directory inside the container.
- `COPY`: Copies files from your host computer into the container filesystem.
- `RUN`: Executes build-time commands (e.g. `npm install`, `npm run build`).
- `ENV`: Defines environment variables inside the container.
- `EXPOSE`: Documents which network port the application listens on.
- `USER`: Switches execution to a non-root user for security.
- `CMD`: The default command executed when the container starts (e.g. `node dist/main`).

#### 4. Volumes (Persistent Data)
By default, **containers are ephemeral**. When a container is deleted or rebuilt, all data written inside its filesystem is lost.
- To persist data (such as PostgreSQL database tables), Docker uses **Volumes**.
- A Docker volume mounts a dedicated storage folder on your host machine into the container path (e.g. `pgdata -> /var/lib/postgresql/data`). Even if the container is destroyed, the volume survives.

#### 5. Networks & Service Discovery
Docker creates virtual software-defined networks (bridge networks).
- Containers attached to the same network can communicate with each other using **container names as hostnames**.
- Example: Inside Docker, the backend connects to PostgreSQL using `postgres:5432` instead of `localhost:5432`. Docker's internal DNS handles the translation automatically.

#### 6. Multi-Stage Builds
In modern development, build tools (TypeScript compiler, linters, dev dependencies) are heavy (~1 GB) but are not needed at runtime.
- **Stage 1 (Builder):** Uses full tools to compile source code into JavaScript.
- **Stage 2 (Runner):** Starts fresh with a tiny Alpine Linux image, copies **only** the compiled output (`dist/`) and production dependencies, and discards all build tools.
- **Benefit:** Reduces image size from 1.2 GB to ~150 MB and significantly reduces security vulnerabilities.

---

## Part 2: How to Setup Docker in General

### 2.1 Setting Up Docker on Windows (Recommended for GymRetain)

Docker on Windows runs native Linux containers using **WSL 2 (Windows Subsystem for Linux 2)**.

#### Step 1: Enable Hardware Virtualization in BIOS/UEFI
1. Restart your PC and press `F2`, `F10`, `F12`, or `Del` to enter BIOS/UEFI.
2. Ensure **Intel Virtualization Technology (Intel VT-x)** or **AMD-V / SVM Mode** is set to **Enabled**.
3. Save and reboot into Windows.
4. Verify in Windows: Open **Task Manager** (`Ctrl + Shift + Esc`) -> **Performance** tab -> **CPU** -> Look for **Virtualization: Enabled**.

#### Step 2: Install or Update WSL 2
Open **PowerShell as Administrator** and run:
```powershell
wsl --update
```
If WSL is not installed yet, run:
```powershell
wsl --install
```
Restart your computer if prompted.

#### Step 3: Install Docker Desktop for Windows
1. Download Docker Desktop from: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Run the installer `Docker Desktop Installer.exe`.
3. During installation, ensure the option **"Use WSL 2 instead of Hyper-V (recommended)"** is checked.
4. Complete the installation and restart your computer if required.

#### Step 4: Verify Docker Desktop
1. Launch **Docker Desktop** from your Start Menu.
2. Wait 30–60 seconds until the bottom-left icon turns **green** with the text: **"Engine running"**.
3. Open a normal PowerShell terminal and verify:
```powershell
docker --version
docker compose version
docker run hello-world
```
If `docker run hello-world` prints a success message, your Docker setup is 100% operational!

---

### 2.2 Setting Up Docker on macOS
1. Download **Docker Desktop for Mac** from [docker.com](https://www.docker.com/products/docker-desktop/) (choose Apple Silicon or Intel chip).
2. Drag `Docker.app` into your `Applications` folder.
3. Open Docker Desktop and grant requested permissions.
4. Verify in Terminal:
```bash
docker --version
docker compose version
```

---

### 2.3 Setting Up Docker on Linux (Ubuntu / Debian)
Run the official Docker convenience script:
```bash
# 1. Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Allow non-root user to run Docker
sudo usermod -aG docker $USER
newgrp docker

# 3. Verify
docker --version
docker compose version
```

---

## Part 3: Running GymRetain in Docker

GymRetain is configured as a production-grade multi-container architecture using `docker-compose.yml`:

```
                           +---------------------------+
                           |  Web Browser (Host PC)   |
                           +-------------+-------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
              http://localhost:3000               http://localhost:4000
                       |                                   |
                       v                                   v
        +-----------------------------+     +-----------------------------+
        |     gymretain_frontend      |     |      gymretain_backend      |
        |  Next.js 14 Standalone      |     |  NestJS + Prisma Client     |
        |  Container Port: 3000       |     |  Container Port: 4000       |
        +--------------+--------------+     +--------------+--------------+
                       |                                   |
                       |  Internal Network: gymretain_net  |
                       +-----------------+-----------------+
                                         |
                               DATABASE_URL (postgres:5432)
                                         |
                                         v
                        +---------------------------------+
                        |       gymretain_postgres        |
                        |       PostgreSQL 16 Alpine      |
                        |   Row-Level Security (RLS)      |
                        |   Healthcheck: pg_isready       |
                        +----------------+----------------+
                                         |
                                         v
                        +---------------------------------+
                        |    Named Volume: pgdata         |
                        | (Persistent Database Storage)   |
                        +---------------------------------+
```

---

### 3.1 Container Architecture & Components

#### Container 1: `gymretain_postgres` (Database)
- **Image:** `postgres:16-alpine` (ultra-lightweight Alpine Linux distribution).
- **Security:** Configured with tenant-isolation Row-Level Security (RLS) policies.
- **Persistence:** Volume `pgdata` preserves gym records, members, check-ins, streaks, and payments even when the container stops.
- **Healthcheck:** Evaluates `pg_isready -U postgres -d gymretain` every 5 seconds to ensure the database engine is truly ready to accept SQL queries.

#### Container 2: `gymretain_backend` (API & Retention Engine)
- **Dockerfile:** Multi-stage build in `backend/Dockerfile`.
  - Installs OpenSSL and dependencies.
  - Generates Prisma client bindings (`npx prisma generate`).
  - Compiles TypeScript to production JavaScript (`npm run build`).
  - Prunes dev dependencies.
- **Startup Pipeline:**
  ```bash
  sh -c "npx prisma migrate deploy && npm run prisma:seed && node dist/main"
  ```
  1. Runs all pending Prisma migrations (creating tables, indexes, and RLS policies).
  2. Seeds 4 Pakistani gyms (*Iron House Lahore*, *K-Town Crossfit*, *Margalla Heights*, *Canary Defense Test Gym*) with memberships and at-risk members.
  3. Boots the NestJS HTTP server listening on `0.0.0.0:4000`.

#### Container 3: `gymretain_frontend` (Owner Dashboard & Kiosk)
- **Dockerfile:** Multi-stage build in `frontend/Dockerfile`.
  - Builds Next.js in `standalone` mode (reducing image size from 1.5GB to ~150MB).
  - Runs under an unprivileged `nextjs` system user (`UID 1001`) for zero-root security.
- **Port:** Exposes port `3000` to the host machine.

---

### 3.2 Step-by-Step Instructions: Launching GymRetain

#### Step 1: Ensure Docker Desktop is Running
Make sure Docker Desktop is open and shows a green "Engine running" indicator in your Windows taskbar.

#### Step 2: Open Terminal in the Project Root
Open PowerShell in `e:\GymRetain`:
```powershell
cd e:\GymRetain
```

#### Step 3: Launch the Full Stack with One Command
```powershell
docker compose up --build -d
```

**Flag Explanations:**
- `--build`: Forces Docker to build or update the images from the `Dockerfile`s.
- `-d` (detached mode): Runs all containers in the background, keeping your terminal prompt free.

#### Step 4: Verify Container Status
Check that all 3 services are active:
```powershell
docker compose ps
```

Expected output:
```text
NAME                 IMAGE                 STATUS                    PORTS
gymretain_postgres   postgres:16-alpine    Up (healthy)              0.0.0.0:5432->5432/tcp
gymretain_backend    gymretain-backend     Up                        0.0.0.0:4000->4000/tcp
gymretain_frontend   gymretain-frontend    Up                        0.0.0.0:3000->3000/tcp
```

#### Step 5: Follow Container Logs
To watch the migration, seeding, and server initialization in real-time:
```powershell
# Follow backend logs
docker compose logs -f backend
```

You will see:
```text
gymretain_backend | Applying migration `20260926000000_init_rls`
gymretain_backend | 🌱 Seeding Pakistani GymRetain demo database...
gymretain_backend | ✅ Seed complete!
gymretain_backend | 🚀 GymRetain API is running on: http://localhost:4000/api/v1
```

#### Step 6: Access GymRetain in Your Browser
- **Owner Admin Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Front-Desk QR Kiosk:** [http://localhost:3000/check-in](http://localhost:3000/check-in)
- **Backend API Root:** [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

---

## Part 4: Operations & Management Cheatsheet

### Everyday Commands

| Goal | Command | Description |
|---|---|---|
| **Start containers** | `docker compose up -d` | Starts existing containers in the background without rebuilding. |
| **Stop containers** | `docker compose stop` | Gracefully stops running containers without losing data. |
| **Resume containers** | `docker compose start` | Resumes stopped containers. |
| **Stop and remove** | `docker compose down` | Stops and removes containers and internal networks. |
| **Rebuild after code edits** | `docker compose up --build -d` | Re-compiles code and restarts updated services. |
| **View combined logs** | `docker compose logs -f` | Live streams logs from all 3 services. |
| **View single service logs** | `docker compose logs -f backend` | Live streams logs only from the backend. |

---

### Database Operations Inside Docker

#### 1. Open Interactive PostgreSQL CLI (`psql`)
You can query tables and check RLS policies directly inside the database container:
```powershell
docker compose exec postgres psql -U postgres -d gymretain
```
Useful SQL queries inside `psql`:
```sql
-- View all seeded gyms
SELECT id, name, slug, city FROM gyms;

-- View all members
SELECT name, phone, status FROM members;

-- Exit psql
\q
```

#### 2. Run Prisma Studio in Docker
To visually inspect and edit records via a web UI:
```powershell
docker compose exec backend npx prisma studio --port 5555 --hostname 0.0.0.0
```
Then open [http://localhost:5555](http://localhost:5555) in your browser.

#### 3. Complete Database Reset (Wipe & Re-seed)
To start with a 100% fresh database:
```powershell
# 1. Stop containers and destroy the named volume
docker compose down -v

# 2. Restart (this recreates the volume, applies migrations, and seeds)
docker compose up --build -d
```

---

## Part 5: Troubleshooting & FAQ

### Issue 1: `failed to connect to docker API at npipe:////./pipe/dockerDesktopLinuxEngine`
* **Cause:** The Docker Desktop application is closed, or the WSL 2 Linux engine has not finished starting.
* **Solution:** Launch **Docker Desktop** from the Windows Start menu. Wait until the whale icon in the Windows taskbar stays solid and green, then re-run your command.

### Issue 2: Port Conflict: `Bind for 0.0.0.0:5432 failed: port is already allocated`
* **Cause:** A local PostgreSQL instance or dev server is already running on port 5432, 4000, or 3000 outside Docker.
* **Solution:** Inspect and terminate the process holding the port:
  ```powershell
  Get-NetTCPConnection -LocalPort 5432, 4000, 3000 -ErrorAction SilentlyContinue
  ```
  Or change the host port mapping in `docker-compose.yml` (e.g. `'5433:5432'` or `'3002:3000'`).

### Issue 3: Backend says `Can't reach database server at postgres:5432`
* **Cause:** Backend started before PostgreSQL finished initializing its database files.
* **Solution:** GymRetain uses `condition: service_healthy` with `pg_isready` in `docker-compose.yml`. If this ever desynchronizes, simply restart:
  ```powershell
  docker compose restart backend
  ```

### Issue 4: Next.js or NestJS Code Changes Are Not Reflected
* **Cause:** Docker images are static snapshots created at build time.
* **Solution:** Re-run `docker compose up --build -d`. Docker's layer caching will only rebuild the changed files, completing in just a few seconds.

---

## Summary of Default Environment & Credentials

```ini
# PostgreSQL
Host (Outside Docker): localhost:5432
Host (Inside Docker):  postgres:5432
User:                  postgres
Password:              postgrespassword
Database:              gymretain

# Backend
API Base URL:          http://localhost:4000/api/v1
Environment:           production

# Frontend
Dashboard URL:         http://localhost:3000
Kiosk Attendance URL:  http://localhost:3000/check-in
```
