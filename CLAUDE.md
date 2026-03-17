# PCAP Trainer Web — Claude Code Guide

## Project Overview
Web rewrite of the PCAP-31-03 Python certification trainer. Next.js 16 with App Router, TypeScript, Tailwind CSS v4 (class-based dark mode, defaults to dark). Replaces the CustomTkinter desktop app.

**Original desktop app**: `~/Desktop/Claude/pcap-trainer` — reference for quiz logic, DB schema, and quiz modes.

## Commands

```bash
pnpm dev        # Development server (http://localhost:3000)
pnpm build      # Production build
pnpm lint       # ESLint
```

## Tech Stack
- **Framework**: Next.js 16, App Router, React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 — class-based dark mode (`@variant dark (&:where(.dark, .dark *))`)
- **Package manager**: pnpm

## Dark Mode
Dark mode is class-based (Tailwind v4). The `<html>` element always has `className="dark"` — no system preference toggle (the app is dark-only by design, matching the original desktop app).

To use dark variants in components: `dark:bg-zinc-900`, `dark:text-white`, etc.

## Project Structure

```
app/
  layout.tsx       # Root layout — sets lang="de", className="dark", metadata
  globals.css      # Tailwind import + dark mode variant + CSS variables
  page.tsx         # Home / landing page
public/            # Static assets
```

## Domain Model (from original app)

### Quiz Modes
| Mode | Description |
|---|---|
| `exam` | 40 random questions, 65-min timer, 70 % pass threshold |
| `quicktest` | Configurable n questions + timer |
| `learn` | All questions, immediate answer feedback |
| `wrong_stack` | Only previously wrong questions |
| `flagged` | Only manually flagged questions |

### Data Shapes (reference)
```ts
type Question = {
  id: number
  q_number: number
  text: string
  section: string
  answers: { letter: string; text: string }[]  // parsed from answers_json
  correct: string   // comma-separated letters: "A" | "C,D"
  multi: boolean
}

type Session = {
  id: number
  mode: "exam" | "learn" | "wrong_stack" | "flagged" | "quicktest"
  started_at: string
  finished_at?: string
  score?: number
  total?: number
  passed?: boolean
}
```

### Wrong Stack Logic
- Added on wrong answer (`times_wrong++`, `correct_streak = 0`)
- Removed after 2 consecutive correct answers (`correct_streak >= 2`)
