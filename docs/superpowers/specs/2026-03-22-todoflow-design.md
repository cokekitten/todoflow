# TodoFlow - Personal Todo List with Telegram Reminders

## Overview

A personal todo list web application for managing tasks by date and tags, with Telegram bot integration for daily reminders. Designed for single-user, local network deployment.

## Goals

- Manage todos organized by date and tags
- Default view is "today", with calendar navigation to any date
- Tags serve as both filter and grouping mechanism
- Daily reminders via Telegram: summarize a target date's full todo list the day before and the day of
- Simple password protection for access control
- All configuration managed through a settings page

## Architecture

### Application Structure

Single Next.js application handling frontend, API, and business logic.

```
src/
  app/              # Pages and routes (App Router)
    (auth)/         # Password authentication page
    (main)/         # Main three-column layout (protected)
    settings/       # Settings page (protected)
    api/
      todos/        # Todo CRUD endpoints
      tags/         # Tag management endpoints
      reminders/    # Reminder trigger endpoint
      settings/     # Settings read/write endpoints
      auth/         # Login/logout endpoints
  server/
    todos/          # Todo query and mutation logic
    tags/           # Tag management logic
    reminders/      # Reminder calculation and dispatch
    telegram/       # Telegram Bot API client
    db/             # SQLite connection, schema, migrations
  components/       # Shared UI components
    calendar/       # Calendar widget
    todo-list/      # Todo list and item components
    sidebar/        # Left and right sidebar components
    settings/       # Settings form components
```

### Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js (App Router) | Pages + API in one project |
| Styling | Tailwind CSS | Fast iteration, dark theme support |
| Database | SQLite via better-sqlite3 | Single-user, local, zero config |
| ORM | Drizzle ORM | Lightweight, excellent SQLite support |
| Telegram | Direct Bot API calls (fetch) | Only need sendMessage, no SDK needed |
| Scheduling | System cron → internal API | Decoupled from web process lifecycle |
| Deployment | Internal network, next start or Docker | Simple single-process deployment |

### Reminder Trigger

- System cron runs every 30 minutes (or hourly), calling `POST /api/reminders/trigger`
- The endpoint reads configured reminder times from the database
- If current time matches a configured reminder window, it executes the reminder logic
- `CRON_SECRET` environment variable protects this endpoint via `Authorization: Bearer <secret>` header
- Telegram Bot Token and Chat ID are read from database settings (env vars as fallback)

## Data Model

### todos

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| title | TEXT NOT NULL | Todo content |
| completed | INTEGER DEFAULT 0 | 0 = pending, 1 = completed |
| date | TEXT | Target date (YYYY-MM-DD), NULL = unscheduled |
| sort_order | INTEGER DEFAULT 0 | Global ordering within a date view (not per-tag-group); creation order by default |
| created_at | TEXT | ISO 8601 timestamp |
| updated_at | TEXT | ISO 8601 timestamp |

### tags

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| name | TEXT UNIQUE NOT NULL | Tag display name |
| color | TEXT | Hex color code for UI display |
| sort_order | INTEGER DEFAULT 0 | Tag list ordering |

### todo_tags (many-to-many)

| Column | Type | Description |
|--------|------|-------------|
| todo_id | TEXT NOT NULL | FK → todos.id (CASCADE delete) |
| tag_id | TEXT NOT NULL | FK → tags.id (CASCADE delete) |
| PRIMARY KEY | (todo_id, tag_id) | Composite key |

### reminder_logs (deduplication)

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| target_date | TEXT NOT NULL | The date being reminded about (YYYY-MM-DD) |
| remind_type | TEXT NOT NULL | `day_before` or `same_day` |
| sent_at | TEXT NOT NULL | ISO 8601 timestamp of when sent |

### settings (key-value)

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT PRIMARY KEY | Setting identifier |
| value | TEXT | Setting value |
| updated_at | TEXT | ISO 8601 timestamp |

Known setting keys:
- `password_hash` — bcrypt hash of access password (empty = no auth)
- `telegram_bot_token` — Telegram Bot API token
- `telegram_chat_id` — Telegram chat ID for notifications
- `reminder_time_day_before` — Time for day-before reminder (default: "20:00")
- `reminder_time_same_day` — Time for same-day reminder (default: "08:00")

## Page Structure

### Three-Column Layout

```
┌──────────────┬────────────────────────────────┬──────────────────┐
│  Left (220px)│  Center (flex)                 │  Right (260px)   │
│              │                                │                  │
│  Logo        │  Date heading + "New" button   │  Upcoming        │
│              │                                │  reminders       │
│  Calendar    │  Todos grouped by tag:         │                  │
│  - month nav │    [Tag name]                  │  Overdue         │
│  - dot marks │      □ todo item               │  items           │
│  - click day │      □ todo item               │                  │
│              │      ✓ completed item           │  Unscheduled     │
│  ─────────── │                                │  count           │
│  Tags        │    [Tag name]                  │                  │
│  - tag list  │      □ todo item               │                  │
│  - + create  │                                │                  │
│              │                                │                  │
│  ─────────── │                                │                  │
│  Settings    │                                │                  │
└──────────────┴────────────────────────────────┴──────────────────┘
```

### Views

**Date View (default: today)**
- URL: `/` redirects to `/date/YYYY-MM-DD` (today)
- Shows all todos for the selected date, grouped by tag
- Creating a todo here auto-assigns the current page date
- Todos without tags appear in an "Uncategorized" group

**Tag View**
- URL: `/tag/<tag-id>`
- Shows all todos with this tag, regardless of date
- Each todo shows its date (if any) as a secondary label
- Creating a todo here auto-assigns this tag, no date

**Settings Page**
- URL: `/settings`
- Sections: Password, Telegram, Reminder Times
- "Test notification" button to verify Telegram config

**Auth Page**
- URL: `/login`
- Full-screen password input
- Only shown when password is configured and user is not authenticated

### Navigation Behavior

- Clicking a calendar date navigates to that date's view
- Clicking a tag in the left sidebar navigates to that tag's view
- Calendar dots indicate dates that have todos
- Today is always highlighted in the calendar
- The currently active date or tag is visually highlighted

## Authentication

- Password stored as bcrypt hash in `settings` table (`password_hash` key)
- If `password_hash` is empty or missing, authentication is skipped entirely
- On login, set an httpOnly cookie with a session token (random UUID)
- Session token stored in an in-memory Map (single user; restart requires re-login, which is acceptable)
- Next.js middleware checks the cookie on all routes except `/login` and `/api/auth`
- Cookie expiry: 7 days (configurable)
- The `/api/reminders/trigger` endpoint uses `CRON_SECRET` header auth, not the password system

## Reminder System

### Trigger Flow

1. Cron calls `POST /api/reminders/trigger` with `Authorization: Bearer <CRON_SECRET>`
2. Endpoint reads `reminder_time_day_before` and `reminder_time_same_day` from settings
3. Checks if current time falls within the configured reminder windows (within 30-min tolerance to handle cron frequency). All time comparisons use server-local timezone.
4. For day-before reminders: query dates = tomorrow that have uncompleted todos
5. For same-day reminders: query dates = today that have uncompleted todos
6. For each qualifying date, check `reminder_logs` for existing entry
7. If not yet sent: build summary message, send via Telegram, write to `reminder_logs`

### Telegram Message Format

**Day-before reminder:**
```
📋 明日待办提醒 | 3月25日 周二

【工作】
  □ 提交周报
  □ Review PR #342

【生活】
  □ 牙医预约
  □ 交房租

共 4 项未完成
```

**Same-day reminder:**
```
📋 今日待办 | 3月25日 周二

【工作】
  □ 提交周报
  □ Review PR #342

【生活】
  □ 牙医预约
  □ 交房租

共 4 项未完成
```

Todos are grouped by tag in the message. Untagged todos appear under "【其他】".

## Visual Design

- Dark theme only (first version)
- Background: near-black (#0a0a0a)
- Left sidebar: slightly lighter (#111)
- Right sidebar: slightly lighter (#0f0f0f)
- Accent color: purple (#7c3aed) — used for today highlight, active states, buttons, tag highlights
- Todo items: dark cards (#161616) with subtle borders (#222)
- Overdue items: red-tinted background with red accent (#f87171)
- Typography: system font stack, 13px base
- Reference: DevBrain-style compact calendar and navigation

## Scope Boundaries

### In Scope (v1)

- Three-column layout with calendar, todo list, and summary panels
- Date view with today as default
- Tag view showing all todos for a tag
- Todo CRUD (create, read, update, delete)
- Todo completion toggle
- Tag management (create, rename, delete, color)
- Grouped display by tags within date view
- Calendar with month navigation and todo dot indicators
- Right panel: upcoming reminders, overdue items, unscheduled count
- Telegram daily reminders (day-before + same-day)
- Password authentication (optional)
- Settings page (password, Telegram config, reminder times, test notification)
- SQLite local database

### Out of Scope (v1)

- Multi-user / registration / permissions
- Drag-and-drop reordering
- Sub-tasks / nested todos
- Todo notes / description field
- Recurring tasks
- Telegram bot command interaction
- Light theme / theme switching
- Mobile responsive layout
- Data import / export
- Search functionality
- Undo operations
