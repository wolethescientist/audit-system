# Audit Management System - Frontend

Modern Next.js 14 frontend for the Audit Management System.

## Features

- 🎨 Modern UI with TailwindCSS
- 🔐 JWT Authentication
- 📊 Real-time Dashboard
- 🔄 React Query for data management
- 🎯 Role-based navigation
- 📱 Responsive design
- ⚡ Fast page loads with Next.js

## Getting Started

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/              # Next.js 14 App Router pages
├── components/       # Reusable React components
├── lib/             # Utilities and configurations
└── store/           # Zustand state management
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Key Technologies

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **React Query** - Data fetching
- **Zustand** - State management
- **Axios** - HTTP client

## Pages

- `/login` - Authentication
- `/dashboard` - Main dashboard
- `/audits` - Audit management
- `/planning` - Audit planning
- `/reports` - Report management
- `/followups` - Follow-up tracking
- `/analytics` - Analytics dashboard
- `/users` - User management
- `/departments` - Department management

## Authentication

The app uses JWT tokens stored in localStorage. All API requests include the token in the Authorization header.

## Role-Based Access

Navigation items are filtered based on user role:
- System Admin: Full access
- Audit Manager: Audit management and analytics
- Auditor: Audit execution
- Department Head: Department audits
- Department Officer: Assigned audits
- Viewer: Read-only access
