---
name: Dashboard Refactoring Project
description: Active project context — refactoring the old Ordrat dashboard into the new Next.js/Metronic stack
type: project
---

Actively refactoring the old Ordrat dashboard (React/Axios/Yup) into the new stack (Next.js 16, React 19, Tailwind 4, Zod, NextAuth, TanStack Query).

**Why:** Modernizing the seller dashboard with a new component system (ReUI + Metronic 9) and updated architecture (App Router, server-side route protection).

**How to apply:** Every feature implementation should start by checking the old repo for existing logic. Adapt patterns to the new stack (Zod not Yup, fetch not Axios, NextAuth not raw cookies, no reCAPTCHA).
