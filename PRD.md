# Product Requirements Document: Enhanced User Authentication and Time-Blocking

## 1. Overview

This document outlines the requirements for two new major features for MomentumGrid: OAuth 2.0 with Google and a comprehensive Time-Blocking calendar. These features are designed to improve user onboarding, enhance productivity, and provide a more integrated user experience.

## 2. Feature: OAuth 2.0 with Google

### 2.1. Objective

To provide users with a fast, secure, and convenient way to sign up and log in using their existing Google accounts, while still retaining the option for manual email and password authentication.

### 2.2. User Stories

- As a new user, I want to sign up for MomentumGrid with my Google account so that I don't have to create and remember a new password.
- As an existing user, I want to link my Google account to my MomentumGrid profile for easier login.
- As a returning user, I want to log in to MomentumGrid with a single click using my Google account.

### 2.3. Functional Requirements

- **"Sign in with Google" Button**: A clearly visible "Sign in with Google" button will be added to the `AuthForm.tsx` component.
- **OAuth Flow**:
  - Clicking the button will redirect the user to the Google OAuth consent screen.
  - After granting permission, the user will be redirected back to the application.
  - The application will handle the OAuth callback, retrieve user information (name, email, avatar URL), and create a new user account in Supabase if one doesn't already exist.
  - The user will be logged in and redirected to the main dashboard.
- **Error Handling**: The system will gracefully handle errors such as the user denying permission or network issues.
- **Security**: The implementation will follow best practices for OAuth 2.0 to ensure the security of user data.

### 2.4. Technical Implementation (High-Level)

- **Supabase Integration**: Utilize Supabase's built-in support for Google as an OAuth provider.
- **Frontend**: Update `AuthForm.tsx` to include the Google login button and the logic to initiate the OAuth flow using the Supabase client.
- **Backend**: No significant backend changes are required, as Supabase handles the OAuth callback and user creation.

## 3. Feature: Time-Blocking Calendar

### 3.1. Objective

To empower users with a visual tool to plan their days, allocate time for specific tasks, and build a structured schedule. This feature will provide a calendar-based interface for creating and managing time blocks.

### 3.2. User Stories

- As a user, I want to view my day/week in a calendar format so that I can see how my time is allocated.
- As a user, I want to create time blocks for tasks, appointments, and activities by clicking and dragging on the calendar.
- As a user, I want to assign titles, descriptions, and categories (e.g., work, personal, learning) to my time blocks.
- As a user, I want to easily edit, resize, and delete time blocks to adjust my schedule.

### 3.3. Functional Requirements

- **Calendar View**:
  - A new "Calendar" tab will be added to the main application interface.
  - The calendar will display a daily or weekly view.
  - The view will be interactive, allowing users to create, edit, and delete time blocks.
- **Time Block Creation**:
  - Users can click and drag on an empty time slot to create a new time block.
  - A dialog will appear to enter the title, description, and category for the time block.
- **Time Block Management**:
  - Time blocks will be visually distinct, with colors corresponding to their categories.
  - Users can drag and drop time blocks to reschedule them.
  - Users can resize time blocks to change their duration.
  - Clicking on a time block will open an editor to modify its details.
- **Data Persistence**: All time blocks will be saved to the database and associated with the user's account.

### 3.4. Technical Implementation (High-Level)

- **Database Schema**: A new table named `time_blocks` will be created in Supabase with the following columns:
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to `auth.users`)
  - `title` (text)
  - `description` (text, nullable)
  - `start_time` (timestamp with time zone)
  - `end_time` (timestamp with time zone)
  - `category` (text, nullable)
- **Frontend**:
  - A new component, `TimeBlockingCalendar.tsx`, will be created to render the calendar interface.
  - A library such as `react-big-calendar` or a custom solution with `date-fns` will be used for the calendar grid.
  - TanStack Query will be used to fetch and manage time block data.
  - Dialogs from `shadcn/ui` will be used for creating and editing time blocks.

## 4. Non-Functional Requirements

- **Performance**: The calendar should load and respond quickly, even with a large number of time blocks.
- **Usability**: The interface should be intuitive and easy to use, with clear visual cues.
- **Accessibility**: The feature will adhere to accessibility best practices.

---

# Areas for Improvement and Refinement

Based on my analysis of your project, here are some areas where the codebase could be improved:

### 1. Component Structure and Reusability

- **Observation**: The `components` directory has a mix of feature-specific components (e.g., `AnalyticsTab.tsx`) and generic UI elements. Some components are quite large and could be broken down.
- **Recommendation**:
  - **Atomic Design**: Consider adopting a more structured approach like Atomic Design. Create subdirectories within `components` for `atoms` (buttons, inputs), `molecules` (search bars, forms), `organisms` (header, sidebar), and `templates` (page layouts).
  - **Reusability**: Proactively identify and extract reusable components. For example, if multiple tabs use a similar layout, create a generic `TabContent` component.

### 2. State Management and Data Fetching

- **Observation**: You are using TanStack Query, which is excellent for server state. However, client-side state management could be more centralized.
- **Recommendation**:
  - **Centralized Client State**: For global client-side state (e.g., UI theme, sidebar visibility), consider using a dedicated state management library like Zustand or Jotai. This will help avoid prop drilling and make state management more predictable.
  - **Custom Hooks**: Create custom hooks for your TanStack Query logic (e.g., `useProjects`, `useHabits`). This will encapsulate data fetching logic, make it reusable, and simplify your components.

### 3. Code Quality and Consistency

- **Observation**: The project has a good foundation with ESLint and TypeScript. However, it could be enhanced with more rigorous testing and code formatting.
- **Recommendation**:
  - **Testing**: Now that Vitest and React Testing Library are set up, I recommend adding tests for all major components and business logic. Aim for a healthy test coverage to prevent regressions.
  - **Prettier**: Integrate Prettier for consistent code formatting. This will reduce cognitive load and ensure a uniform coding style across the project.
  - **Absolute Imports**: You are already using absolute imports with `@/`. Ensure this is used consistently throughout the project to improve readability.

### 4. UI/UX and Design System

- **Observation**: You are using `shadcn/ui`, which is a great choice. However, there's an opportunity to build a more cohesive design system.
- **Recommendation**:
  - **Theme and Styling**: Centralize your theme and styling variables (colors, fonts, spacing) in `tailwind.config.ts` and your global CSS files. This will make it easier to maintain a consistent look and feel.
  - **Component Variants**: Leverage `class-variance-authority` to create variants of your `shadcn/ui` components. For example, you could create `primary`, `secondary`, and `destructive` variants for your buttons.

By addressing these areas, you can build a more robust, maintainable, and scalable application.
