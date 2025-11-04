# Project Flow and Structure

This document outlines the project's structure, explaining the purpose of each file and folder, and describing the functionality of key components.

## High-Level Overview

**Momentum Grid** is a productivity platform designed to help users build routines, track habits, manage projects, and achieve their goals. It's a single-page application (SPA) built with a modern tech stack.

- **Frontend:** Vite, React, TypeScript, shadcn-ui, Tailwind CSS
- **Backend:** Supabase (Authentication, Database, Functions)
- **Deployment:** The project is set up to be easily deployed.

## File and Folder Structure

```
.
├── public/                  # Static assets
├── src/                     # Application source code
│   ├── components/          # Reusable React components
│   │   ├── ui/              # UI components (from shadcn-ui)
│   │   ├── Admin/           # Components for the admin dashboard
│   │   ├── Auth/            # Authentication components
│   │   ├── Feedback/        # Feedback components
│   │   ├── Layout/          # Layout components (Header, Sidebar)
│   │   ├── Profile/         # User profile components
│   │   └── projects/        # Components related to project management
│   ├── contexts/            # React contexts (e.g., AuthContext)
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Third-party service integrations (Supabase)
│   ├── lib/                 # Utility functions
│   └── pages/               # Application pages
├── supabase/                # Supabase configuration
│   ├── functions/           # Serverless functions
│   └── migrations/          # Database migrations
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies and scripts
├── vite.config.ts           # Vite configuration
└── README.md                # Project overview
```

### Key Files and Folders Explained

- **`public/`**: This directory contains static assets that are served directly by the web server. This includes the main `index.html` file, images, and other public files.

- **`src/`**: The heart of the application, containing all the source code.

  - **`main.tsx`**: The entry point of the React application. It renders the main `App` component into the DOM.

  - **`App.tsx`**: The root component of the application. It sets up the routing, providers (like `QueryClientProvider` and `AuthProvider`), and global components (like `Toaster`).

  - **`components/`**: This folder is organized by feature, containing reusable React components.
    - **`components/ui/`**: Contains the UI components from the `shadcn-ui` library, such as buttons, dialogs, and cards.
    - **`components/Layout/`**: Components that define the overall structure of the application, like `Sidebar.tsx` and `Header.tsx`.
    - **`components/Auth/`**: Components related to user authentication, such as the login and signup forms.

  - **`contexts/`**: Holds React Contexts for managing global state.
    - **`AuthContext.tsx`**: Manages the user's authentication state and provides it to the rest of the application.

  - **`hooks/`**: Contains custom React hooks that encapsulate reusable logic.

  - **`integrations/`**: Code for connecting to external services.
    - **`supabase/client.ts`**: Initializes the Supabase client, which is used to interact with the Supabase backend.

  - **`lib/`**: A collection of utility functions that can be used throughout the application.
    - **`utils.ts`**: General utility functions.

  - **`pages/`**: Each file in this directory typically represents a page in the application.
    - **`HomePage.tsx`**: The landing page of the application.
    - **`Index.tsx`**: The main dashboard page that users see after logging in.
    - **`Auth.tsx`**: The page for user authentication (login/signup).

- **`supabase/`**: This directory contains all the configuration for the Supabase backend.
  - **`functions/`**: Contains serverless functions that can be deployed to Supabase Edge Functions. These are used for backend logic that shouldn't run on the client-side.
  - **`migrations/`**: Contains SQL files that define the database schema. Supabase uses these files to manage the database structure.

- **`package.json`**: This file lists the project's dependencies and defines scripts for running, building, and testing the application.

- **`vite.config.ts`**: The configuration file for Vite, the build tool used in this project. It defines how the project is built and served in development.

## Key Functions and Components

### `App.tsx`

This is the main component that orchestrates the entire application. It sets up:

- **Routing:** Uses `react-router-dom` to define the different pages of the application and which components to render for each URL.
- **Providers:** Wraps the application with necessary providers:
  - `QueryClientProvider`: For data fetching and caching with `react-query`.
  - `AuthProvider`: To provide authentication state to all components.
  - `TooltipProvider`: For the UI tooltips.
- **Protected Routes:** The `ProtectedRoute` component ensures that only authenticated users can access certain pages (like the dashboard).

### `Sidebar.tsx`

The `Sidebar` component is the main navigation element of the application. It allows users to switch between different tabs:

- **Habits:** For tracking daily habits.
- **Learning:** For managing learning goals.
- **Projects:** For project management.
- **Routines:** For creating and managing routines.
- **Meals:** For meal planning.
- **Analytics:** For viewing progress and analytics.

### `HomePage.tsx`

This is the landing page for new users. It showcases the features of the application and encourages users to sign up.

### `AuthContext.tsx`

This context is crucial for managing user authentication. It provides:

- The current user's session information.
- Functions for signing up, logging in, and logging out.
- A loading state to indicate when an authentication operation is in progress.

Components can consume this context to access the user's authentication state and perform authentication-related actions.

### Supabase Integration

The application uses Supabase for its backend. The integration is handled in `src/integrations/supabase/`.

- **`client.ts`**: This file creates and exports the Supabase client instance. This client is used throughout the application to interact with Supabase services like the database and authentication.
- **`supabase/functions/`**: These are serverless functions that handle backend logic. For example, a function might be used to process a payment or send an email.
- **`supabase/migrations/`**: The database schema is defined in these SQL files. When the project is set up, these migrations are run to create the necessary tables and columns in the Supabase database.

This structure allows for a clean separation of concerns between the frontend and backend, making the application easier to develop and maintain.
