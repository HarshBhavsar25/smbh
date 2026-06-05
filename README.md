# Shree Mauli Boys Hostel Management System

This is a complete production-ready full-stack web application designed for Shree Mauli Boys Hostel. The system includes a public-facing website with a premium glassmorphism design, a highly functional Admin Dashboard, and a tailored Student Portal.

## Architecture

*   **Frontend**: Next.js 15, TypeScript, Tailwind CSS (v4), Framer Motion, Recharts.
*   **Backend**: NestJS, TypeScript, Prisma ORM.
*   **Database**: PostgreSQL.
*   **Integrations**: Cloudinary (Storage), Nodemailer (Email), Firebase Cloud Messaging (Notifications).

## Features

### 1. Public Website
*   **Modern Glassmorphism UI**: High-converting landing page with animated sections.
*   **Features Display**: Responsive display of room types (2, 3, 5 sharing), facilities, and a gallery.
*   **Location Integration**: Embedded Google Maps and easy contact access.

### 2. Admin Dashboard
*   **Analytics Overview**: View real-time occupancy, monthly revenue, and complaint analytics via modern charts.
*   **Student Management**: Add, edit, and assign rooms to students seamlessly.
*   **Community Management**: Review student complaints, reply to them, and mark them as resolved.
*   **Announcements**: Publish urgent notices and blogs directly to the student portal.

### 3. Student Portal
*   **My Space**: Students can view their room assignment and outstanding fee status.
*   **Vacation Requests**: Easily submit vacation requests which generate pre-filled WhatsApp messages for the warden.
*   **Community Feed**: Engage with the community by posting and voting on hostel issues and suggestions.

## Getting Started

### Prerequisites
*   Node.js (v20+)
*   Docker (Optional, for database)
*   PostgreSQL

### Local Setup
1. Clone the repository.
2. Duplicate the `.env.example` files in both the `frontend` and `backend` directories and rename them to `.env`. Fill in the required credentials.
3. Start the backend:
    ```bash
    cd backend
    npm install
    npx prisma db push
    npm run start:dev
    ```
4. Start the frontend:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### Production Deployment
Dockerfiles are provided in both `frontend` and `backend` directories. You can build these images and deploy them using Docker Compose or a Kubernetes cluster.

## License
Proprietary software tailored for Shree Mauli Boys Hostel.
