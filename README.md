# LookJobber — Building your Future

LookJobber is a job-search and recruitment application with a React/Vite
frontend, an Express API, MongoDB persistence, JWT authentication, and
Cloudinary resume uploads. The existing stack is containerized as separate
frontend and backend images. Docker Compose provides a private, persistent
MongoDB service for a complete local deployment.

## Run the complete stack with Docker

Requirements: Docker Engine/Desktop with the Docker Compose plugin.

1. Copy `.env.example` to `.env`.
2. Replace `JWT_SECRET_KEY` and `MONGO_ROOT_PASSWORD` with long, randomly
   generated, alphanumeric values. Do not commit `.env`.
3. Add your Cloudinary account values if you need resume uploads. Set
   `FRONTEND_URL=http://localhost:8080` for the default Compose URL.
4. Build and start the services:

   ```powershell
   docker compose up --build -d
   ```

5. Open [http://localhost:8080](http://localhost:8080). The API is reached
   through the frontend's same-origin `/api/v1` reverse proxy.
6. Check container health and logs:

   ```powershell
   docker compose ps
   docker compose logs --tail 100 backend
   ```

MongoDB is not published to the host. Its data is stored in the named
`mongo_data` volume and survives container restarts. To stop the services
without deleting application data, run `docker compose down`. Do not use
`docker compose down -v` unless you intentionally want to delete the database
volume.

For local development without Docker, install the dependencies in both
`frontend` and `backend`, configure `backend/config/config.env` using
`.env.example` as a reference, run MongoDB, then start the backend and frontend
with `npm run dev` in their respective directories.

## Container images and cloud deployment

Build each image from the repository root:

```powershell
docker build -t lookjobber-backend:latest .\backend
docker build --build-arg VITE_API_BASE_URL=/api/v1 -t lookjobber-frontend:latest .\frontend
```

The frontend image is a static production build served by Nginx. Nginx serves
the SPA and proxies `/api/` to the Compose service named `backend`. The backend
image serves Express on port `4000` and exposes a database-aware `/health`
endpoint. For deployment outside Compose, configure an equivalent reverse
proxy from `/api/` to the backend; do not expose the backend or database
unnecessarily.

Push images to your chosen container registry, then deploy the frontend and
backend to your cloud container service. Configure the backend's environment
variables using the cloud platform's secret manager:

- `PORT=4000`
- `MONGO_URI`: an authenticated MongoDB connection string reachable from the
  backend. For managed MongoDB, configure network access to the backend and
  use a restricted database user. For a persistent Compose deployment, the
  default connection string is built from `MONGO_ROOT_USERNAME` and
  `MONGO_ROOT_PASSWORD`.
- `JWT_SECRET_KEY`: a long, unique signing secret.
- `JWT_EXPIRE` and `COOKIE_EXPIRE`
- `COOKIE_SECURE=true` when users access the site over HTTPS.
- `FRONTEND_URL`: the browser-visible origin allowed by the Express CORS policy.
- `CLOUDINARY_CLIENT_NAME`, `CLOUDINARY_CLIENT_API`, and
  `CLOUDINARY_CLIENT_SECRET` for resume-upload functionality.

The frontend's `VITE_API_BASE_URL` is a build-time setting. Build the image with
`/api/v1` when frontend and API share a host through a reverse proxy. If the API
is hosted on a different origin, set `VITE_API_BASE_URL` to its public API base
URL during the frontend image build and set backend CORS to the frontend's
HTTPS origin.

Terminate TLS at a managed HTTPS ingress, gateway, or reverse proxy. Store
credentials in the cloud secret manager, not in image layers, source control,
build arguments, or browser environment variables. Persist MongoDB data using
a managed MongoDB service or an encrypted, backed-up persistent disk; a
container's writable layer is not durable storage.

This repository contains deployment-ready container configuration, but no
cloud deployment has been performed or verified.

### AWS Docker deployment

The AWS-specific Docker/ECS Fargate architecture, Terraform infrastructure,
deployment steps, security model, cost estimate, smoke test, and viva
preparation are documented in [aws/README.md](./aws/README.md). A live AWS
deployment has not been run from this workspace.

## Environment variables

`.env.example` contains placeholders only. Root `.env` is read by Docker Compose
for interpolation. For the existing non-containerized backend, its dotenv file
is `backend/config/config.env`; it is intentionally excluded from Git.

Never commit database credentials, Cloudinary credentials, JWT secrets, or
production environment files. A backend configuration file containing real
credentials was previously tracked in this repository. Rotate those values
before using the project in production.

## Current scope and limitations

- Authentication, job postings, applications, and resume uploads use the
  existing Express/MongoDB/Cloudinary implementation.
- The jobs page includes five preview listings from
  `frontend/src/data/demoJobs.js` when the jobs API is empty or unavailable.
  API listings take precedence; replace the preview records with your own
  postings when ready.
- The site-wide chat panel is a local demo assistant with topic-based sample
  answers. It does not connect to an AI provider; connect a secured backend AI
  service before presenting it as a live AI feature.
- The requested Supabase, PostgreSQL RLS, Next.js, and Vercel architecture was
  not introduced; the project was kept on its existing stack.
- Admin moderation and automated authorization tests are not supplied.
- AWS infrastructure is defined in `aws/terraform`, but it has not been
  deployed from this workspace. Production TLS requires an ACM certificate,
  and live deployment/performance verification still needs to be run.
- Review backend authorization, file-upload validation, rate limiting, and
  password/session policies before a public production launch.
