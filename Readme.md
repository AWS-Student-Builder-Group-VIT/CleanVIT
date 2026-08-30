# CleanTrack — College Room Cleaning Request System

Replaces the "223 ROOM NO. req. cleaning" WhatsApp workflow with a proper web app: students raise cleaning requests, supervisors assign staff, staff report success/failure with photo proof, and students confirm completion.

---

## 1. Problem Statement

Currently, hostel/PG room cleaning requests are handled informally over WhatsApp group messages (e.g. "223 ROOM NO. req. cleaning"). This has several problems:

- **No accountability** — no record of who requested, who was assigned, or when it was resolved.
- **No status tracking** — students don't know if a request is pending, assigned, in-progress, or done.
- **No proof of failure** — if staff can't clean (room locked, student not present), there's no structured way to report it; it just gets lost in chat.
- **No history/analytics** — supervisors can't see cleaning frequency per room, staff performance, or block-wise trends.
- **Chat clutter** — real requests get buried under unrelated messages.

**Goal:** Build a lightweight web app (Vite + React) with role-based access where:
1. **Students** sign up with Reg No., raise cleaning alerts for their room, add optional comments (type of cleaning), and mark requests as "Done" once satisfied.
2. **Block Supervisors** see all cleaning alerts for their block, assign them to cleaning staff.
3. **Cleaning Staff** (either app users or supervisor-managed) mark requests complete, or mark them "Failed" with a reason + photo proof (e.g. room locked).
4. **Students** get notified of the final outcome — "Cleaning Done" or "Cleaning Failed" (with reason/photo) and can re-raise if needed.

---

## 2. User Roles

| Role | Access |
|---|---|
| **Student** | Sign up/login with Reg No. + password. Raise/view/close own requests. |
| **Block Supervisor** | Login. View all requests for their assigned block. Assign staff, monitor status. |
| **Cleaning Staff** | Login (or supervisor-managed accounts). View assigned tasks. Mark done/failed with photo + reason. |
| **Admin** *(optional, phase 2)* | Manage blocks, supervisors, staff accounts, view analytics across all blocks. |

---

## 3. Core Workflow (State Machine)

```
[Student raises request]
        │
        ▼
   PENDING  ──────────────► (Supervisor assigns staff)
        │                          │
        │                          ▼
        │                     ASSIGNED
        │                          │
        │                          ▼
        │                   IN_PROGRESS (optional: staff starts task)
        │                          │
        │            ┌─────────────┴─────────────┐
        │            ▼                            ▼
        │        COMPLETED                     FAILED
        │       (staff marks done)      (staff uploads photo + reason,
        │            │                   e.g. "room locked")
        │            ▼                            │
        │    Student notified                     ▼
        │            │                   Student notified "Cleaning Failed"
        │            ▼                            │
        │    Student clicks                       ▼
        │    "Mark as Done"              Student can RE-RAISE request
        │            │                   (creates new PENDING entry,
        │            ▼                   references failed one)
        │        CLOSED
        ▼
   (auto-cancel if unattended > X hrs — optional)
```

Status enum: `PENDING → ASSIGNED → IN_PROGRESS → COMPLETED → CLOSED` or `PENDING/ASSIGNED → FAILED → (re-raised)`

---

## 4. Data Model

### `users`
| field | type | notes |
|---|---|---|
| id | UUID | PK |
| role | enum | `student` \| `supervisor` \| `staff` \| `admin` |
| name | string | |
| reg_no | string | unique, required for students |
| password_hash | string | bcrypt |
| block_id | FK → blocks | |
| room_no | string | required for students only |
| phone | string | optional |
| created_at | datetime | |

### `blocks`
| field | type | notes |
|---|---|---|
| id | UUID | PK |
| name | string | e.g. "Block A" |
| type | enum | `boys` \| `girls` \| `mixed` |
| supervisor_id | FK → users | |

### `cleaning_requests`
| field | type | notes |
|---|---|---|
| id | UUID | PK |
| student_id | FK → users | |
| block_id | FK → blocks | |
| room_no | string | |
| cleaning_type | string | e.g. "sweeping", "washroom", "waste disposal" |
| comment | text | optional student note |
| status | enum | see state machine |
| assigned_staff_id | FK → users | nullable |
| assigned_at | datetime | nullable |
| resolution_type | enum | `completed` \| `failed` \| null |
| resolution_note | text | staff's reason if failed |
| resolution_photo_url | string | proof image (esp. for failed) |
| resolved_at | datetime | |
| student_confirmed_at | datetime | when student clicks "Mark as Done" |
| parent_request_id | FK → cleaning_requests | nullable, links re-raised request to original |
| created_at | datetime | |
| updated_at | datetime | |

### `notifications` *(optional, or just poll/derive from status)*
| field | type |
|---|---|
| id | UUID |
| user_id | FK |
| request_id | FK |
| message | string |
| is_read | boolean |
| created_at | datetime |

---

## 5. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite + React)                 │
│  ┌────────────┐ ┌────────────────┐ ┌────────────────────┐    │
│  │ Student UI │ │ Supervisor UI  │ │  Staff UI            │    │
│  │ - Signup/  │ │ - Block-wise   │ │  - Assigned task list │    │
│  │   Login    │ │   request feed │ │  - Mark Done          │    │
│  │ - Raise    │ │ - Assign staff │ │  - Mark Failed +      │    │
│  │   alert    │ │ - Track status │ │    upload photo       │    │
│  │ - Track my │ │                │ │                        │    │
│  │   requests │ │                │ │                        │    │
│  │ - Mark done│ │                │ │                        │    │
│  └────────────┘ └────────────────┘ └────────────────────┘    │
│         Routing: react-router-dom | State: Context/Zustand     │
│         Styling: Tailwind CSS                                  │
└───────────────────────────┬──────────────────────────────────┘
                             │ REST (Axios) / JWT in headers
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                 │
│  ┌───────────┐ ┌────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │ Auth       │ │ Requests   │ │ Blocks/Users │ │ Upload     │ │
│  │ /auth/*    │ │ /requests/*│ │ /blocks/*    │ │ /upload/*  │ │
│  │ JWT +      │ │ CRUD +     │ │ (admin/      │ │ (multer →  │ │
│  │ bcrypt     │ │ status     │ │ supervisor)  │ │ Cloudinary/│ │
│  │            │ │ transitions│ │              │ │ S3)        │ │
│  └───────────┘ └────────────┘ └──────────────┘ └───────────┘ │
└───────────────────────────┬──────────────────────────────────┘
                             ▼
              ┌───────────────────────────┐
              │   Database (MongoDB /      │
              │   PostgreSQL via Prisma)   │
              └───────────────────────────┘
                             │
              ┌───────────────────────────┐
              │  Image storage (Cloudinary │
              │  / Firebase Storage / S3)  │
              └───────────────────────────┘
```

### Recommended Stack (fastest to build & free-tier friendly)
- **Frontend:** Vite + React + React Router + Tailwind CSS + Axios + Zustand (lightweight state)
- **Backend:** Node.js + Express, OR **Firebase** (Auth + Firestore + Storage) to skip building a backend entirely
- **Database:** MongoDB Atlas (free tier) if using custom backend, or Firestore if using Firebase
- **Auth:** JWT (custom backend) or Firebase Auth (email as `regno@college.app` trick, or custom auth doc)
- **Image upload (failure proof):** Cloudinary free tier or Firebase Storage
- **Realtime updates (nice-to-have):** Firestore's native realtime listeners, or Socket.io if using Express, so supervisors/students see status changes live without refresh
- **Deployment:** Vercel/Netlify (frontend) + Render/Railway (backend) or all-in on Firebase

> **Recommendation for a student project / hackathon timeline:** Use **Firebase** (Auth + Firestore + Storage). It removes the need to build/host a backend, has built-in realtime updates (perfect for "student sees status change live"), and has a generous free tier. Switch to a custom Express + MongoDB backend later if you need more control.

---

## 6. Screens / Pages

**Student**
- Signup (Name, Reg No, Password, Block Type, Block Name, Room No.)
- Login
- Dashboard — "Raise New Request" button + list of my past/active requests with status badges
- Request detail — shows comment, status, staff assigned, and failure photo/reason if applicable
- "Mark as Done" button (only visible when status = COMPLETED)
- "Re-raise" button (only visible when status = FAILED)

**Supervisor**
- Login
- Dashboard — table/kanban of all requests in their block, filterable by status
- Assign staff dropdown per request
- Status overview (counts: pending/assigned/completed/failed)

**Staff**
- Login
- My assigned tasks list
- Task detail — "Mark Completed" or "Mark Failed" (opens form: reason dropdown + photo upload)

---

## 7. MVP Scope (build this first)

1. Student signup/login (Reg No + password)
2. Student: raise cleaning request (room no. auto-filled from profile, cleaning type + comment)
3. Supervisor: login, view all block requests, assign to staff
4. Staff: login, view assigned tasks, mark Completed or Failed (with photo + note)
5. Student: sees live status, marks Completed as "confirmed/closed", sees Failed with reason+photo and can re-raise

**Phase 2 (later):** Admin panel, analytics dashboard, push/email notifications, auto-escalation of stale requests, staff performance ratings.

---

## 8. Prompt for Your AI Coding Assistant

Copy-paste this into Claude Code / Cursor / whatever you're using to start building:

```
Build a web app called "CleanTrack" using Vite + React (JavaScript) for the frontend
and Firebase (Auth + Firestore + Storage) as the backend. This is a hostel/college
room cleaning request system replacing an informal WhatsApp workflow.

ROLES: student, supervisor, staff — stored as a `role` field on the user doc in
Firestore `users` collection. Auth: use Firebase Auth with email/password, where
email is synthesized as `${regNo}@cleantrack.app` for students so login can still
be done via Reg No. Supervisors and staff accounts are pre-created manually (no
public signup for them).

DATA MODEL (Firestore collections):
- users: { uid, role, name, regNo (students only), blockId, blockName, roomNo
  (students only), createdAt }
- blocks: { id, name, type, supervisorId }
- cleaningRequests: { id, studentId, blockId, roomNo, cleaningType, comment,
  status ('pending'|'assigned'|'in_progress'|'completed'|'failed'|'closed'),
  assignedStaffId, assignedAt, resolutionType, resolutionNote,
  resolutionPhotoUrl, resolvedAt, studentConfirmedAt, parentRequestId,
  createdAt, updatedAt }

PAGES/ROUTES (react-router-dom):
- /signup — student-only signup form: name, regNo, password, blockType
  (boys/girls/mixed), blockName, roomNo
- /login — role-agnostic login (regNo or email + password), redirect by role
- /student/dashboard — "Raise Cleaning Request" button (opens modal: cleaning
  type dropdown + optional comment) + list of own requests with status badges,
  live-updated via Firestore onSnapshot
- /student/requests/:id — detail view; show "Mark as Done" button when status
  is 'completed'; show failure reason + photo and a "Re-raise Request" button
  when status is 'failed'
- /supervisor/dashboard — table of all cleaningRequests where blockId matches
  supervisor's block, filterable by status, with an "Assign Staff" dropdown
  (lists staff users in same block) per pending row
- /staff/dashboard — list of requests where assignedStaffId == current user,
  each with "Mark Completed" and "Mark Failed" buttons; Mark Failed opens a
  form requiring a reason (dropdown: "Room locked", "Student not present",
  "Access denied", "Other" + text) and a required photo upload to Firebase
  Storage before submission

BEHAVIOR:
- Use Firestore real-time listeners (onSnapshot) so status changes reflect
  instantly across student/supervisor/staff views without manual refresh.
- Protect routes by role using a wrapper component that checks the logged-in
  user's `role` from context before rendering.
- Use Tailwind CSS for styling; keep the UI clean, mobile-first (most students
  will use this on their phones), with clear color-coded status badges
  (yellow=pending, blue=assigned, orange=in_progress, green=completed,
  red=failed, gray=closed).
- On "Mark as Done" (student) set status to 'closed' and studentConfirmedAt
  timestamp.
- On "Re-raise Request", create a NEW cleaningRequests doc with status
  'pending' and parentRequestId pointing to the failed one, carrying over
  roomNo/cleaningType.
- Validate Reg No. uniqueness on signup.
- Use React Context or Zustand for auth state (current user + role).

STRUCTURE:
- Set up project with `npm create vite@latest cleantrack -- --template react`
- Organize as: /src/pages, /src/components, /src/context, /src/services
  (firebase.js, requests.js, auth.js), /src/routes (ProtectedRoute.jsx)
- Add a firebase.js config file with placeholders for env vars
  (VITE_FIREBASE_API_KEY etc.) reading from .env

Start by scaffolding the project structure and Firebase config, then build
auth (signup/login/logout + role-based redirect), then the student flow end
to end, then supervisor, then staff. Confirm the data model with me before
writing Firestore security rules.
```

---

## 9. Suggested Build Order

1. Scaffold Vite + React project, install Tailwind, React Router, Firebase SDK
2. Firebase project setup — Auth, Firestore, Storage; write `.env` template
3. Auth flow: signup (student), login (all roles), role-based route protection
4. Student: raise request + live-updating "my requests" list
5. Supervisor: block-filtered request feed + staff assignment
6. Staff: assigned task list + Mark Completed / Mark Failed (with photo upload)
7. Student: Mark as Done / Re-raise on failed requests
8. Polish: status badges, empty states, loading states, mobile responsiveness
9. (Phase 2) Admin panel, analytics, notifications

---

## 10. Open Questions to Decide Before Building

- Do **cleaning staff** get their own login, or does the **supervisor** manage assignment purely internally (staff never touch the app, supervisor marks completed/failed on their behalf)? This significantly simplifies MVP if staff don't need accounts.
- Should there be a time-based auto-escalation (e.g. notify supervisor if a request sits PENDING > 2 hours)?
- Multiple students per room — should any roommate be able to raise/close a request, or only the one who raised it?
- Should failed requests auto-notify the supervisor too, or only the student?