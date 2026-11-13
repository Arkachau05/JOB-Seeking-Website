# LookJobber

LookJobber is a full-stack job-search and recruitment website. The React and
Vite frontend connects to an Express REST API, which stores users, jobs, and
applications in MongoDB. User authentication uses JWT cookies, and resume
uploads use Cloudinary.

## Requirements

- Node.js 20 or later (LTS recommended), including npm.
- MongoDB Community Server running locally, or a MongoDB Atlas connection URI.
- A Cloudinary account for resume uploads (optional).
- Git to clone the project.

Cloudinary is only needed to submit applications with resumes. MongoDB is
required for user accounts, jobs, and applications.

## Install

1. Clone the repository and open its root folder.
2. Create the backend's local environment file from the safe template:

   ```powershell
   Copy-Item backend\config\config.env.example backend\config\config.env
   ```

3. Edit `backend/config/config.env`:
   - Keep `MONGO_URI=mongodb://127.0.0.1:27017` when using a local MongoDB
     service. For Atlas, replace it with your own connection URI.
   - Set `JWT_SECRET_KEY` to a long, random value.
   - Add your Cloudinary cloud name, API key, and API secret to enable resume
     uploads.
   - Keep `FRONTEND_URL=http://localhost:5173` for local development.
4. Install each app's locked dependencies:

   ```powershell
   cd backend
   npm ci
   cd ..\frontend
   npm ci
   cd ..
   ```

## Run locally

Make sure the MongoDB service is running, then start the backend and frontend
in separate terminals from the project root.

Backend terminal:

```powershell
cd backend
npm run dev
```

Frontend terminal:

```powershell
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The frontend calls the
backend at `http://localhost:4000/api/v1`. Check
[http://localhost:4000/health](http://localhost:4000/health) to confirm the
API and MongoDB connection are ready.

To run the backend without the auto-reloader, use `npm start` in `backend`.
To create a production frontend build, run `npm run build` in `frontend`.

## Environment configuration

The backend reads `backend/config/config.env`. The tracked
`backend/config/config.env.example` contains placeholders only; keep the real
configuration file private and never commit database, Cloudinary, or JWT
credentials. The frontend uses the local API URL by default; set
`VITE_API_BASE_URL` only when connecting it to a different API origin.

## Project layout

- `frontend/` — React UI, Vite development server, and production build.
- `backend/` — Express API, MongoDB models, authentication, and file uploads.

The application includes registration/login, job posting and browsing, job
applications, and user-specific job/application views.
