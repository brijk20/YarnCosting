# Yarn Cost Calculator

A responsive React + Vite web application that helps weaving teams calculate yarn consumption, cost per meter/pick, and profitability. The app supports multiple weft patterns, GST inclusive costing, and optional Supabase-backed authentication so users can store yarn qualities and calculation snapshots.

## Key Features

- Warp & weft calculator with configurable denier/count, extra charges, and shortage allowances
- Multi-weft support with ratio-based pick distribution
- Automatic warp/weft weight per meter & per 100 m, cost per meter, cost per pick, and GST-inclusive totals
- Optional sale price to track profit per meter and margin %
- Rate shortcuts: enter the base ₹/kg once, then choose **Final**, **+ GST**, or **+₹ + GST** (adds your chosen flat ₹ before applying 5% GST)
- Business operations workspace covering sales, payments, exposure dashboard, and reporting (foundation phase)

- Supabase authentication (email + password) with per-user storage for:
  - Reusable yarn qualities
  - Calculation snapshots including the computed totals
  - Shared presets curated by super admins
- Public qualities/calculations so unauthenticated users can browse shared templates
- Zustand for state management, Tailwind CSS for styling, and fully responsive layouts for desktop, tablet, and mobile

## Project Structure

```
yarn-cost-app/
├── src/
│   ├── components/
│   │   ├── auth/         # Authentication panel
│   │   ├── calculator/   # Calculator form + result panels
│   │   └── saved/        # Supabase-powered saves list
│   ├── contexts/         # Auth provider (Supabase session handling)
│   ├── hooks/            # Reusable hooks (e.g., useAuth)
│   ├── lib/              # Supabase client + data service
│   ├── store/            # Zustand calculator store
│   ├── utils/            # Calculation helpers & formatting
│   └── styles.css        # Tailwind entry point
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` (create it if it does not exist yet) and add your Supabase keys:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
# Optional: override table names if you used a different naming convention
# VITE_SUPABASE_QUALITIES_TABLE=qualities
# VITE_SUPABASE_CALCULATIONS_TABLE=calculations
# Set comma separated emails that should get super-admin access in the app
# VITE_SUPER_ADMINS=owner@example.com
```

If these values are missing the app still works locally, but sign-in and persistence are disabled.

### 3. Supabase schema

Create the following tables (SQL) inside Supabase:

```sql
create table public.qualities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text,
  warp jsonb,
  weft_config jsonb,
  wefts jsonb,
  additional jsonb,
  pricing jsonb,
  notes text,
  is_public boolean default false,
  created_at timestamptz default now()
);

create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  quality_name text,
  inputs jsonb,
  results jsonb,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- Allow public read access and authenticated CRUD on owned records
alter table public.qualities enable row level security;
alter table public.calculations enable row level security;

create policy "Public qualities" on public.qualities
  for select using (is_public = true or auth.uid() = user_id);

create policy "Manage own qualities" on public.qualities
  for all using (auth.uid() = user_id);

create policy "Public calculations" on public.calculations
  for select using (is_public = true or auth.uid() = user_id);

create policy "Manage own calculations" on public.calculations
  for all using (auth.uid() = user_id);
```

### 4. Run locally

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
npm run preview
```

## Calculations Reference

- Warp yarn per meter (kg) = `(total ends × denier) / 9,000,000`
- Weft yarn per meter (kg) = `((effective picks × denier × panno inches) / 9,000,000) × (1 + shortage %)`
- Cost per meter = `yarn per meter × (rate + extra charges)`
- Cost per pick = `cost before GST / (picks per inch × 39.3701)`
- GST = `cost before GST × 5%`
- Profit per meter = `sale price − cost before GST`
- Margin % = `(profit per meter / cost before GST) × 100`

## Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Create a new project in Vercel and import the repo.
3. Set the **Build Command** to `npm run build` and **Output Directory** to `dist` (Vercel detects Vite automatically).
4. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under *Settings → Environment Variables* for both Preview and Production.
5. Trigger a deploy. Once live, invite teammates from Supabase → *Authentication* so they can sign in.

## Next Steps

- Add input presets tailored to specific loom widths or fabric types
- Provide CSV export for costing breakdowns
- Integrate unit tests for critical calculation utilities

Happy weaving! 🧵


## Supabase setup

1. Create the `qualities` and `calculations` tables (or adjust the env overrides) using the SQL below:

```sql
create table if not exists public.qualities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  name text,
  warp jsonb,
  weft_config jsonb,
  wefts jsonb,
  additional jsonb,
  pricing jsonb,
  notes text,
  is_public boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  quality_name text,
  inputs jsonb,
  results jsonb,
  is_public boolean default false,
  created_at timestamptz default now()
);
```

2. Enable Row Level Security and policies to allow owners (and public reads for shared presets).

3. Seed test users (optional) by running:

```bash
cd yarn-cost-app
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key node scripts/createTestUsers.mjs
```

The script creates:
- `admin@ambrox.in` / `Admin@123` (super admin)
- `user@ambrox.in` / `User@123`

Remember to keep the service role key out of version control.
