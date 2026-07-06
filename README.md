# EHR AI Frontend

A role-driven Electronic Health Record (EHR) frontend built with React, Vite, Tailwind CSS, and Axios. This application supports healthcare workflows for doctors, patients, pharmacists, lab technicians, radiology technicians, and administrators.

## Key Features

- Secure multi-role authentication and authorization
- Patient monitoring, medical records, and appointments
- Lab and radiology request management
- Pharmacy medication and prescription tracking
- AI review requests and lab result analysis
- Financial dashboards and earnings summaries
- Theme toggle and Arabic/English internationalization
- Responsive sidebar-based layout for desktop and mobile

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- React Router DOM v7
- Axios
- Recharts
- i18next / react-i18next
- react-hot-toast
- Heroicons
- react-hook-form and Zod (available)

## Getting Started

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Application Structure

- `src/main.jsx`: entry point and app mount.
- `src/App.jsx`: routing, protected routes, and global providers.
- `src/contexts/`: auth, theme, and language providers.
- `src/components/`: layout, common UI primitives, and feature components.
- `src/pages/`: page-level views and role-specific dashboards.
- `src/services/`: backend API client and domain services.
- `src/hooks/`: reusable UI hooks for search, filter, and notifications.
- `src/i18n/`: internationalization setup with Arabic and English resources.
- `src/styles/`: global CSS and custom utilities.
- `src/utils/`: shared constants, helpers, and formatters.

## Backend Integration

The app proxies API requests to `http://localhost:8000` through Vite. The Axios client in `src/services/api.js` attaches the bearer token automatically and handles common HTTP errors.

## Documentation

- `architecture.md`: full architecture documentation.
- `component-structure.md`: component hierarchy and page-level structure.

## Notes

This repository is designed for a graduation-level EHR AI project and follows a modular page-driven architecture with clean separation between authentication, layout, and domain features.
