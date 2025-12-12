# Mika Marketing - Project Context

## Overview
Full-funnel marketing analytics platform with AI-powered insights. Multi-tenant SaaS for agencies and brands to manage campaigns, landing pages, leads, and analytics.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: Neon Postgres (with pgvector for AI embeddings)
- **ORM**: Drizzle
- **Auth**: Clerk
- **State**: React Query (TanStack Query v5)
- **UI**: Mantine + custom components with CSS-in-JS (styled-jsx)
- **AI**: Gemini (planned)
- **Deployment**: Vercel

## Directory Structure
```
src/
├── app/
│   ├── (auth)/           # Clerk sign-in/sign-up
│   ├── (protected)/      # Authenticated routes
│   │   ├── campaigns/
│   │   ├── crm/
│   │   ├── pages/
│   │   ├── analytics/
│   │   └── settings/
│   ├── (public)/         # Public routes (landing, lp/[id])
│   ├── api/              # API routes
│   │   ├── campaigns/
│   │   ├── leads/
│   │   ├── pages/
│   │   ├── workspaces/
│   │   └── webhooks/
│   ├── layout.tsx        # Root layout (Mantine, Providers)
│   └── providers.tsx     # Clerk, React Query, Workspace
├── components/           # Reusable UI components
│   ├── Shell.tsx         # Main app shell with sidebar
│   ├── KanbanBoard.tsx   # Lead management
│   ├── CampaignTimeline.tsx
│   └── ...
├── lib/
│   ├── db/
│   │   ├── index.ts      # Drizzle client
│   │   └── schema.ts     # 37 tables, all workspace-scoped
│   ├── queries/          # React Query hooks
│   │   ├── campaigns.ts
│   │   ├── leads.ts
│   │   └── pages.ts
│   ├── workspace/
│   │   └── context.tsx   # Workspace provider + useWorkspace()
│   └── gemini/           # AI integration (planned)
└── types/
    └── index.ts          # Shared TypeScript types
```

## Architecture Patterns

### Multi-Tenancy
Every table has `workspaceId`. Data isolation is enforced at:
1. **Middleware**: Reads `workspace_id` cookie, injects `x-workspace-id` header
2. **API Routes**: Read header, filter all queries by workspaceId
3. **React Query**: Queries invalidate on workspace switch

### Data Flow
```
Page Component
  → useHook() (React Query)
    → fetch('/api/...')
      → API Route reads x-workspace-id header
        → Drizzle query with workspaceId filter
          → Returns JSON
```

### Workspace Context
```tsx
const { workspace, workspaces, switchWorkspace, isLoading } = useWorkspace();
```
- Stored in cookie: `workspace_id`
- Invalidates queries on switch: `['campaigns']`, `['leads']`, `['pages']`

## Database Schema (37 tables)

### Core Entities
| Table | Purpose |
|-------|---------|
| `workspaces` | Multi-tenant containers |
| `users` | Clerk-synced users |
| `workspace_members` | User ↔ Workspace with roles |
| `campaigns` | Marketing campaigns with UTM, budget |
| `landing_pages` | Pages with A/B variants |
| `leads` | CRM with stage pipeline |
| `visitors` | Anonymous tracking |
| `sessions` | Visit sessions |
| `events` | All tracking events |
| `transactions` | Revenue tracking |

### AI/Analytics
| Table | Purpose |
|-------|---------|
| `ai_insights` | Generated insights |
| `content_embeddings` | Vector embeddings (768d) |
| `knowledge_entries` | Workspace knowledge base |
| `monitors` | Metric alerting |
| `monitor_alerts` | Triggered alerts |
| `reports` | Saved report configs |
| `report_runs` | Report execution history |

### Brand System
| Table | Purpose |
|-------|---------|
| `brand_settings` | Colors, fonts, tokens |
| `brand_voice` | AI copy guidelines |
| `brand_assets` | Images with embeddings |
| `brand_templates` | Reusable templates |

## Key Types (src/types/index.ts)

```typescript
// All use `null` for optional fields (DB convention)
type Campaign = {
  id: string;
  workspaceId: string;
  name: string;
  status: CampaignStatus;
  budget: number | null;
  spent: number;
  // ... computed metrics
};

type Lead = {
  id: string;
  workspaceId: string;
  email: string;
  stage: LeadStage;
  lifetimeValue: number;
  tags: string[];
  // ...
};

type LandingPage = {
  id: string;
  workspaceId: string;
  slug: string;
  status: PageStatus;
  isVariant: boolean;
  // ... computed metrics
};
```

## API Route Pattern

```typescript
// app/api/[resource]/route.ts
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { tableName } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function getWorkspaceId(req: NextRequest): string | null {
  return req.headers.get('x-workspace-id');
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const workspaceId = getWorkspaceId(req);
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  
  const result = await db
    .select()
    .from(tableName)
    .where(eq(tableName.workspaceId, workspaceId));
    
  return NextResponse.json(result);
}
```

## React Query Hook Pattern

```typescript
// lib/queries/[resource].ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/lib/workspace/context';
import type { Resource } from '@/types';

export function useResources() {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ['resources', workspace?.id],
    queryFn: () => fetch('/api/resources').then(r => r.json()),
    enabled: !!workspace?.id,
    staleTime: 60_000,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => fetch('/api/resources', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] }),
  });
}
```

## Environment Variables

```bash
# Neon Postgres
POSTGRES_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Gemini (planned)
GEMINI_API_KEY=...
```

## Current Status

### ✅ Done
- Database schema (37 tables with pgvector)
- Auth flow (Clerk)
- Workspace multi-tenancy
- API routes: campaigns, leads, pages
- React Query hooks
- Pages: campaigns, crm, pages (list)
- Type system aligned with DB

### 🚧 In Progress
- Landing page editor
- Dashboard analytics
- Real-time metrics

### 📋 TODO
- Gemini AI integration
- Email sequences
- Monitors/alerts
- Brand system UI
- Integrations (Meta, Google Ads)
- Public tracker script

## Conventions

### Naming
- DB columns: `snake_case`
- TypeScript: `camelCase`
- Components: `PascalCase`
- Files: `kebab-case` (components) or `camelCase` (utils)

### Styling
- Use `styled-jsx` for component styles
- CSS variables: `var(--bg-primary)`, `var(--accent)`, etc.
- Dark theme by default

### Null vs Undefined
- DB/API: Use `null` for missing optional values
- Never use `undefined` in types that touch the DB

### Dates
- DB stores as `timestamp`
- API returns ISO strings
- Frontend displays with `toLocaleString('pt-BR')`

## Common Commands

```bash
# Dev
npm run dev

# DB
npx drizzle-kit push      # Push schema to DB
npx drizzle-kit studio    # Visual DB browser

# Deploy
git push                  # Auto-deploys to Vercel
```

## File Quick Reference

| Need to... | File |
|------------|------|
| Add a table | `src/lib/db/schema.ts` |
| Add an API | `src/app/api/[name]/route.ts` |
| Add a hook | `src/lib/queries/[name].ts` |
| Add a type | `src/types/index.ts` |
| Add a page | `src/app/(protected)/[name]/page.tsx` |
| Edit shell/nav | `src/components/Shell.tsx` |
| Edit workspace logic | `src/lib/workspace/context.tsx` |
| Edit auth middleware | `src/middleware.ts` |