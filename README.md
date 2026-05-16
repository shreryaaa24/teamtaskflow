# Team Task Manager

A full-stack project and task management application, similar to Trello or Asana.

## Features

- **User Authentication:** Secure JWT-based login and registration with bcrypt password hashing.
- **Project Management:** Create projects (automatically become Admin) and add/remove members.
- **Task Management:** Create, assign, and track tasks (To Do, In Progress, Done) with priority and due dates.
- **Dashboard:** Visual overview of tasks by status, overdue tasks, and tasks per user.
- **Role-Based Access Control:** 
  - Admins can manage tasks and members.
  - Members can only view and update tasks assigned to them or others in the project.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router, Axios, Lucide React icons.
- **Backend:** Node.js, Express.js.
- **Database:** Prisma ORM with SQLite (for local) and PostgreSQL (for production).
- **Deployment:** Railway (monolithic deployment).

## Local Setup

### Prerequisites
- Node.js (v18+)
- npm

### Installation Steps

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd team-task-manager
   ```

2. **Install backend dependencies:**
   ```bash
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up the Database (SQLite locally):**
   A `.env` file is already created or create one in the root directory:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your_jwt_secret_key_here"
   ```
   
   Run Prisma migrations to create the local SQLite database:
   ```bash
   npx prisma db push
   ```

5. **Start the Development Servers:**
   - Terminal 1 (Backend):
     ```bash
     npm run dev
     ```
   - Terminal 2 (Frontend):
     ```bash
     cd client
     npm run dev
     ```

6. Open your browser at `http://localhost:5173` to use the application.

## Deployment to Railway (Mandatory Requirement)

This project is structured as a monolithic repository, meaning Railway will build both the frontend and backend simultaneously, and the Express backend will serve the compiled React app.

### Steps to Deploy

1. Create a GitHub repository and push your code to it.
2. Sign up / Log in to [Railway](https://railway.app/).
3. Click **New Project** -> **Deploy from GitHub repo**.
4. Select your repository.
5. Railway will automatically detect the Node.js environment and start building using the `npm run build` script defined in `package.json`.
   - *Note: Our build script automatically generates the Prisma client, compiles the backend TypeScript, and builds the Vite React frontend.*
6. **Set up PostgreSQL Database on Railway:**
   - In your Railway project, click **New** -> **Database** -> **Add PostgreSQL**.
   - Wait for it to deploy.
7. **Configure Environment Variables:**
   - Go to your Node.js application service settings on Railway -> **Variables**.
   - Click "New Variable", name it `DATABASE_URL`, and click the reference button to link it to your newly created PostgreSQL `DATABASE_URL`.
   - Add another variable: `JWT_SECRET` with a secure random string.
8. **Update Prisma Schema (Before pushing to Railway):**
   If you want to use PostgreSQL on Railway instead of SQLite, update `prisma/schema.prisma` before you push:
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```
   *(Note: Remember to run `npx prisma db push` or migrations again after changing to postgres)*
9. The deployment will complete and Railway will provide you with a public URL (generate a domain in the Railway Settings tab if needed).

---
**Enjoy managing your tasks!**
