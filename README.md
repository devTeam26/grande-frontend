# GrandeBeach — Frontend

A full-featured chalet booking web application built for Al Fakhama Resort. The platform supports browsing, booking, and managing chalets with bilingual support (Arabic / English), a loyalty programme, and a complete admin control panel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| State Management | Redux Toolkit |
| Routing | React Router v7 |
| Forms & Validation | React Hook Form + Zod |
| Internationalisation | i18next (AR / EN, RTL/LTR) |
| Animations | Framer Motion + AOS |
| Notifications | React Hot Toast |

---

## Features

- **Chalet catalogue** — browse, filter, and view detailed chalet pages
- **Booking flow** — date selection → pricing summary → checkout → confirmation
- **Authentication** — login, register, and guest mode; session persisted via `localStorage`
- **Loyalty programme** — Bronze / Silver / Gold / Platinum tiers with points and discounts
- **Admin panel** — manage bookings, chalets, pricing, users, and promotions
- **Bilingual UI** — full Arabic (RTL) and English (LTR) support with instant switching
- **Responsive design** — mobile-first layout tested across all screen sizes

---

## Prerequisites

- Node.js >= 18
- npm >= 9

---

## Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd grande-frontend

# 2. Install dependencies
npm install

# 3. Copy and configure environment variables
cp .env.example .env
# Then open .env and fill in the required values
```

---

## Environment Variables

Create a `.env` file at the project root (see `.env.example`):

```env
# Google Maps embed key — used on the Contact page map
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key_here

# Backend API base URL — set when a real API is connected
VITE_API_BASE_URL=https://api.alfakhama.com
```

> All Vite environment variables must be prefixed with `VITE_` to be exposed to the browser bundle.

---

## Run & Build

```bash
# Start development server (http://localhost:5173)
npm run dev

# Type-check and build for production
npm run build

# Preview the production build locally
npm run preview

# Run ESLint
npm run lint
```

The production build outputs to the `dist/` folder.

---

## Demo Credentials

The application currently runs on mock data with no live backend. Use these credentials to test different roles:

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@alfakhama.com | admin123 |
| Manager | manager@alfakhama.com | manager123 |
| Customer | khalid@example.com | user123 |

---

## Project Structure

```
src/
├── components/
│   ├── booking/        # Booking calendar, pricing summary
│   ├── chalets/        # Chalet card, filters, availability calendar
│   ├── layout/         # Header, Footer, Layout wrappers
│   ├── payment/        # Payment method selector
│   └── ui/             # Shared UI primitives (Button, Input, Modal, …)
├── data/               # Mock data & static config (chalets, users, pricing rules)
├── hooks/              # Typed Redux hooks
├── i18n/               # i18next setup + EN/AR locale files
├── pages/
│   ├── admin/          # Dashboard, ManageBookings, ManageChalets, …
│   └── *.tsx           # Public pages (Home, Chalets, Booking, Checkout, …)
├── store/              # Redux store + slices (auth, booking, chalets, admin, ui)
├── types/              # Shared TypeScript types
└── utils/              # Helpers: pricing logic, class merging, constants
```

---

## Routing

| Path | Page | Access |
|---|---|---|
| `/` | Home | Public |
| `/chalets` | Chalet catalogue | Public |
| `/chalets/:id` | Chalet detail | Public |
| `/booking/:chaletId` | Date & options selection | Public |
| `/checkout` | Payment & confirmation | Public |
| `/confirmation/:bookingId` | Booking confirmed | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/profile` | User profile & loyalty | Authenticated |
| `/brands` | Brand showcase | Public |
| `/contact` | Contact & map | Public |
| `/reviews` | Guest reviews | Public |
| `/admin` | Admin dashboard | Admin |
| `/admin/bookings` | Manage bookings | Admin |
| `/admin/chalets` | Manage chalets | Admin |
| `/admin/pricing` | Manage pricing rules | Admin |
| `/admin/users` | Manage users | Admin |
| `/admin/promotions` | Manage promotions | Admin |

---

## Responsive Design

The application is built mobile-first using Tailwind CSS. All pages are tested and functional on:

- Mobile (320px and up)
- Tablet (768px)
- Desktop (1024px and up)

Arabic RTL layout is applied automatically when the user switches to Arabic.

---

## Deployment (Vercel)

1. Push the repository to GitHub.
2. Import the project on [Vercel](https://vercel.com).
3. Set the **Framework Preset** to `Vite`.
4. Add the environment variables from `.env` in the Vercel project settings.
5. Deploy — Vercel handles the build command (`npm run build`) and serves `dist/` automatically.

> The Vite config already sets `base: './'`, which ensures all asset paths resolve correctly on Vercel and static hosting providers.

---

## Backend API Connection

This version of the frontend uses **local mock data** (`src/data/`) and in-memory Redux state — no live API calls are made.

When a real backend is ready:

1. Set `VITE_API_BASE_URL` in `.env` to the API base URL.
2. Replace the mock thunks in `src/store/slices/` with `createAsyncThunk` calls pointing to the API.
3. Remove or gate the demo credentials in `src/data/mockUsers.ts`.

All data shapes are defined in `src/types/index.ts` and can serve as the API contract.

---

## Contact

For project enquiries contact the development team or reach the resort via WhatsApp: **+965 9097 6666**
