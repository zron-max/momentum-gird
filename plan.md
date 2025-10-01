# MomentumGrid Development Checklist

- [ ] **Phase 1: Project Foundation & Code Quality**
  - [x] **Step 1:** Set Up Prettier for Code Formatting

- [ ] **Phase 2: Time-Blocking Feature - Backend**
  - [x] **Step 2:** Create `time_blocks` Database Table
  - [x] **Step 3:** Implement CRUD API for Time Blocks

- [ ] **Phase 3: Time-Blocking Feature - Frontend**
  - [ ] **Step 4:** Create and Route Placeholder Calendar Page
  - [ ] **Step 5:** Integrate Calendar Library & Fetch Data
  - [ ] **Step 6:** Implement "Create Time Block" UI
  - [ ] **Step 7:** Implement "Update Time Block" UI
  - [ ] **Step 8:** Implement "Delete Time Block" UI

- [ ] **Phase 4: General Improvements**
  - [ ] **Step 9:** Refactor Component Structure (Atomic Design)
  - [ ] **Step 10:** Centralize Client-Side State (Zustand)

---

# Development Plan: MomentumGrid Incremental Build

This document outlines a series of small, testable, incremental steps to build the new features outlined in the PRD. Each step must be completed and have its associated tests passing before proceeding to the next.

### Phase 1: Project Foundation & Code Quality

**Step 1: Set Up Code Formatting**

- **Goal:** Ensure consistent code style across the project before adding new code.
- **Action:**
  1.  Install Prettier and its ESLint integration: `npm install -D prettier eslint-config-prettier`.
  2.  Create a `.prettierrc` file in the project root with basic configuration.
  3.  Update `eslint.config.js` to include `eslint-config-prettier` to prevent conflicts.
  4.  Run `npx prettier --write .` to format the entire codebase.
- **Verification (Tests):**
  1.  Run `npm run lint`. The command must pass without any formatting-related errors.

### Phase 2: Time-Blocking Feature - Backend

**Step 2: Create `time_blocks` Database Table**

- **Goal:** Establish the database schema for storing time block data.
- **Action:**
  1.  Create a new SQL migration file in the `supabase/migrations` directory.
  2.  In the new file, write the SQL to create the `time_blocks` table with the columns specified in the PRD: `id`, `user_id`, `title`, `description`, `start_time`, `end_time`, `category`.
  3.  Enable Row Level Security (RLS) on the table.
  4.  Add an RLS policy that allows users to perform all actions (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) only on rows where the `user_id` matches their own authenticated `uid`.
- **Verification (Tests):**
  1.  Apply the migration to your local Supabase development environment.
  2.  Manually inspect the database schema using the Supabase Studio to confirm the table, columns, and RLS policies have been created correctly.

**Step 3: Implement CRUD API for Time Blocks**

- **Goal:** Create a single, secure backend endpoint for creating, reading, updating, and deleting time blocks.
- **Action:**
  1.  Create a new Supabase Edge Function named `time-blocks`.
  2.  The function will inspect `Deno.serveRequest.method` to handle `POST`, `GET`, `PUT`, and `DELETE` requests.
  3.  For all methods, it will first check for a valid user session, returning a `401 Unauthorized` error if one is not found.
  4.  **POST:** Validate the request body and insert a new record into the `time_blocks` table. Return `201` with the new data.
  5.  **GET:** Query and return all time blocks for the authenticated user. Return `200` with the data array.
  6.  **PUT:** Validate the request body and update the specified time block. Return `200` with the updated data.
  7.  **DELETE:** Delete the specified time block. Return `204 No Content`.
- **Verification (Tests):**
  1.  Create a comprehensive test file for the `time-blocks` function.
  2.  Write test cases for each HTTP method, covering valid requests, invalid request bodies, and unauthenticated access.
  3.  Ensure all tests pass.

### Phase 3: Time-Blocking Feature - Frontend

**Step 4: Create and Route Placeholder Calendar Page**

- **Goal:** Set up the basic frontend structure for the new feature so it's accessible within the app.
- **Action:**
  1.  Create a new component file: `src/pages/CalendarPage.tsx`. The component should render a simple heading, like `<h1>Time-Blocking Calendar</h1>`.
  2.  In `src/App.tsx`, add a new `Route` for the path `/calendar` that renders the `CalendarPage` component, wrapped in the `ProtectedRoute`.
  3.  In `src/components/Sidebar.tsx`, add a new navigation link pointing to `/calendar`.
- **Verification (Tests):**
  1.  Create a new test file: `src/pages/CalendarPage.test.tsx`.
  2.  Write a simple test that renders the `CalendarPage` component and asserts that the `<h1>` is present.
  3.  Ensure the test passes.

**Step 5: Integrate Calendar Library & Fetch Data**

- **Goal:** Display a calendar and populate it with the user's time blocks from the backend.
- **Action:**
  1.  Install a calendar library (e.g., `react-big-calendar`).
  2.  Create a new custom hook `src/hooks/useTimeBlocks.ts` that uses TanStack Query to fetch data from the `GET /time-blocks` endpoint.
  3.  In `CalendarPage.tsx`, use the `useTimeBlocks` hook to get the data.
  4.  Render the calendar component and pass the fetched time block data to it.
- **Verification (Tests):**
  1.  Create a test file for `CalendarPage.tsx`.
  2.  Mock the `useTimeBlocks` hook to return sample data.
  3.  Render the component and assert that the calendar displays the mocked events.
  4.  Ensure the test passes.

**Step 6: Implement "Create Time Block" UI**

- **Goal:** Allow users to create new time blocks via the UI.
- **Action:**
  1.  In `useTimeBlocks.ts`, add a mutation using `useMutation` that calls the `POST /time-blocks` endpoint.
  2.  In `CalendarPage.tsx`, add a "Create Event" button that opens a `shadcn/ui` Dialog containing a form.
  3.  When the form is submitted, call the creation mutation from the `useTimeBlocks` hook and refetch the calendar events on success.
- **Verification (Tests):**
  1.  In the `CalendarPage.test.tsx`, mock the creation mutation.
  2.  Simulate a user clicking the "Create Event" button, filling out the form, and submitting.
  3.  Assert that the mutation function was called with the correct data from the form.
  4.  Ensure the test passes.

**Step 7: Implement "Update Time Block" UI**

- **Goal:** Allow users to edit existing time blocks.
- **Action:**
  1.  In `useTimeBlocks.ts`, add a mutation for updating that calls the `PUT /time-blocks` endpoint.
  2.  In `CalendarPage.tsx`, make it so clicking an existing event on the calendar opens the same Dialog, but pre-filled with the event's data.
  3.  On form submission, call the update mutation.
- **Verification (Tests):**
  1.  Mock the update mutation.
  2.  Simulate a user clicking an event, changing a value in the form, and submitting.
  3.  Assert that the update mutation was called with the correct ID and updated data.
  4.  Ensure the test passes.

**Step 8: Implement "Delete Time Block" UI**

- **Goal:** Allow users to delete time blocks.
- **Action:**
  1.  In `useTimeBlocks.ts`, add a mutation for deleting that calls the `DELETE /time-blocks` endpoint.
  2.  Add a "Delete" button to the event editing Dialog. Include a confirmation step (e.g., an `AlertDialog`).
  3.  On confirmation, call the delete mutation.
- **Verification (Tests):**
  1.  Mock the delete mutation.
  2.  Simulate a user opening the edit dialog, clicking delete, and confirming.
  3.  Assert that the delete mutation was called with the correct ID.
  4.  Ensure the test passes.

### Phase 4: General Improvements

**Step 9: Refactor Component Structure (Atomic Design)**

- **Goal:** Improve maintainability by organizing components into a logical structure.
- **Action:**
  1.  Create the following directories: `src/components/atoms`, `src/components/molecules`, `src/components/organisms`.
  2.  Move a few existing components as a proof-of-concept: `src/components/ui/button.tsx` -> `src/components/atoms/Button.tsx`, and `src/components/Auth/AuthForm.tsx` -> `src/components/organisms/AuthForm.tsx`.
  3.  Update all import paths that are affected by the move.
- **Verification (Tests):**
  1.  Run the entire existing test suite (`npm test`). All tests must pass, proving the refactor did not break any functionality.

**Step 10: Centralize Client-Side State (Zustand)**

- **Goal:** Simplify client-side state management and avoid prop drilling.
- **Action:**
  1.  Install Zustand: `npm install zustand`.
  2.  Create a new store in `src/stores/uiStore.ts` to manage a piece of global UI state (e.g., `isSidebarOpen`).
  3.  Refactor the main layout/sidebar components to use this store instead of local state or props for managing the sidebar's visibility.
- **Verification (Tests):**
  1.  Write a new test for the component that now uses the Zustand store.
  2.  In the test, manually manipulate the store's state and assert that the component's UI updates correctly.
  3.  Ensure the test passes.
