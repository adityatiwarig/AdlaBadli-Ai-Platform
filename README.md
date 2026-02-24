# AdlaBadli AI

AdlaBadli AI is an AI-assisted, time-credit skill exchange platform where users teach what they know and learn what they need without direct monetary payments.

## Overview

The project combines matchmaking, messaging, session execution, AI summaries, and trust workflows into one full-stack application.

Key outcomes:

- AI-based partner discovery with explainable compatibility scoring.
- Time-credit economy with automatic transfer on session completion.
- Full session lifecycle: schedule, start, live progress, end, confirm, rate, and archive.
- Real-time chat via Socket.IO.
- Session-aware AI support (rolling summaries + specialized agents).
- Offline meet request flow with in-app notifications.

## Feature Set

### Authentication and Session Security

- Register/login/logout endpoints.
- Password hashing with `bcryptjs`.
- JWT stored in HTTP-only cookie (`adlabadli_session`).
- Server-side current-user resolution for protected APIs/pages.

### User Profiles and Preferences

- Personal details: name, city, area, bio.
- Skills: teach skills, learn skills, skill level.
- Learning style (`visual`, `auditory`, `reading`, `kinesthetic`, `mixed`).
- Languages and availability slots.
- Offline meet preference.
- Trust, reliability, credits, and completed-session metrics.

### AI Matchmaking

Compatibility scoring (`lib/matching.ts`) includes:

- Skill fit in both directions.
- Skill level proximity.
- Language overlap.
- Availability overlap.
- Trust and reliability strength.
- Location affinity (city/area).
- Learning style chemistry.
- Offline preference alignment.

Response payload includes:

- Numeric score (0-100).
- Confidence tier (`low`, `medium`, `high`).
- Human-readable reasons.
- Category breakdown (skill/schedule/trust/location/chemistry).

### Explore and Discovery UX

- Ranked match listing.
- Filters (name, skill, same city).
- Shortlist toggle with `localStorage` persistence.
- Direct actions to chat or schedule.

### Realtime Messaging

- Separate Socket.IO server (`server/socket-server.js`).
- User-specific socket rooms (`user:<id>`).
- Conversation list with latest message preview.
- Normal chat mode and session-scoped chat mode.
- Search within message thread.
- Clear normal chat history by partner.

### Sessions and Runtime Flow

Session creation supports:

- Teacher/learner assignment.
- Skill and mode (`online` / `offline`).
- Start time and planned duration.

Session actions:

- `start`
- `end`
- `confirm`
- `cancel`
- `delete` (completed sessions only)

Session runtime capabilities:

- Active timer.
- Jitsi meeting link metadata generation.
- Auto-expire + auto-complete when planned duration is reached.

### Credit Economy

- Rate: `10 credits per teaching minute`.
- Transfer rule is strict and capped by learner balance.
- Teacher gain equals learner spend.

### AI Session Intelligence

- Rolling summary generated from session messages.
- Gemini integration (`gemini-1.5-flash`) with fallback output if API key is absent.
- Session-level AI insight memory (`aiInsights`).

Available agents:

- `coach` (action-oriented coaching)
- `icebreaker` (ready-to-send prompts)
- `scheduler` (structured agenda)
- `progress` (gap and next-action analysis)

### Post-Session Quality Workflows

- Ratings with dimensions: punctuality, teaching quality, behavior.
- Trust/reliability recomputation from historical ratings.
- One learner follow-up question allowed within 15 minutes of session end.
- Teacher answer flow for pending follow-up questions.
- Session history preserved even if completed session is deleted.

### Notifications and Offline Meets

- In-app notification center with item delete and clear-all.
- Notification types:
  - `message`
  - `session_scheduled`
  - `offline_meet_request`
- Dedicated offline meet request page (partner/topic/location/time/note).

### Session Completion Event Publishing

- Best-effort webhook emit to Inngest endpoint on completion.
- Event name: `adlabadli/session.completed`.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript.
- Tailwind CSS v4 + Radix UI components.
- MongoDB + Mongoose.
- SWR for client-side data fetching.
- JWT cookie auth.
- Socket.IO + Socket.IO client for realtime updates.
- Gemini API integration for AI features.
- Vercel Analytics (`@vercel/analytics`).

## Project Structure

```txt
app/
  api/
    auth/
    profile/
    users/
    matches/
    messages/
    sessions/
    ratings/
    notifications/
    offline-meets/
    session-questions/
    agents/
  dashboard/
  explore/
  chat/
  sessions/
  offline-meets/
  profile/

lib/
  auth.ts
  db.ts
  matching.ts
  ai.ts
  inngest.ts
  models/

server/
  socket-server.js
```

## Environment Variables

Use `.env.example` as the base.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_DB` | Yes | Database name |
| `JWT_SECRET` | Yes | JWT signing secret |
| `GEMINI_API_KEY` | No | Enables Gemini-powered AI responses |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Socket server URL used by client |
| `SOCKET_PORT` | Yes | Socket server listen port |
| `SOCKET_CORS_ORIGIN` | Yes | Allowed frontend origin for socket CORS |

Reference values:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=adlabadli
JWT_SECRET=change-this-secret
GEMINI_API_KEY=
NEXT_PUBLIC_SOCKET_URL=http://localhost:4001
SOCKET_PORT=4001
SOCKET_CORS_ORIGIN=http://localhost:3000
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- MongoDB instance

### Install

```bash
npm install
```

### Run Locally

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run socket
```

Defaults:

- Web app: `http://localhost:3000`
- Socket server: `http://localhost:4001`

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run socket` | Start Socket.IO relay server |
## Free Deployment (Vercel + Render + MongoDB Atlas)

This project can run on free tiers with this split:

- Web app (Next.js): Vercel Hobby
- Socket server (`server/socket-server.js`): Render Free Web Service
- Database: MongoDB Atlas M0 Free Cluster

### 1) Deploy Socket Server on Render

- Create a new Web Service from this repo.
- Render can auto-detect `render.yaml`.
- Set `SOCKET_CORS_ORIGIN` to your Vercel app URL (for example `https://your-app.vercel.app`).
- After deploy, copy the socket URL (for example `https://adlabadli-socket.onrender.com`).

### 2) Deploy Next.js App on Vercel

- Import this repo into Vercel.
- Set environment variables:
  - `MONGODB_URI` (Atlas URI)
  - `MONGODB_DB`
  - `JWT_SECRET`
  - `GEMINI_API_KEY` (optional)
  - `NEXT_PUBLIC_SOCKET_URL` (your Render socket URL)
  - `SOCKET_CORS_ORIGIN` (your Vercel app URL)
- Deploy.

### 3) MongoDB Atlas Free Cluster

- Create an M0 free cluster.
- Add a database user and network access rules.
- Use the Atlas connection string as `MONGODB_URI`.

### Notes

- The socket service supports host-provided `PORT` automatically.
- `@vercel/analytics` works on Vercel Hobby.

## API Surface

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Profile and Users

- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/users`
- `GET /api/users/:id`

### Matching and Messaging

- `GET /api/matches`
- `GET /api/messages`
- `POST /api/messages`
- `DELETE /api/messages`

### Sessions and Post-Session

- `GET /api/sessions`
- `POST /api/sessions`
- `PATCH /api/sessions`
- `DELETE /api/sessions`
- `DELETE /api/sessions/:id`
- `POST /api/session-questions`
- `PATCH /api/session-questions`
- `GET /api/ratings`
- `POST /api/ratings`

### Notifications and Offline Meets

- `GET /api/notifications`
- `DELETE /api/notifications`
- `POST /api/offline-meets`

### AI Agent Endpoint

- `POST /api/agents`

## Data Model Highlights

- `User`: profile, skills, preferences, economy and trust metrics.
- `Session`: participants, status, timing, credits, summaries, AI insights.
- `Message`: peer and session-linked chat records.
- `Rating`: one rating per rater-session pair.
- `SessionQuestion`: one follow-up learner question per session.
- `Notification`: user-facing event feed.
- `SessionHistory`: durable log of completed sessions.

## Realtime + AI Processing Flow

1. Message is written to MongoDB through `/api/messages`.
2. Receiver gets socket event (`chat:receive`).
3. Notification record is created for receiver.
4. If message is session-scoped, rolling summary is refreshed.
5. AI agent calls append generated insights to session history.

## Multi-User Local Verification

1. Start web app and socket server in separate terminals.
2. Open one normal and one incognito window.
3. Register two distinct users.
4. Match from Explore and open chat.
5. Validate realtime message delivery both directions.
6. Create/start/end a session and verify credits/summary updates.

## Scope Notes

- Video flow uses generated Jitsi links (no embedded proprietary video SDK).
- Offline meet requests are notification-driven and do not yet include accept/reject states.
- Completed session deletion is allowed, while session history snapshots are retained.

