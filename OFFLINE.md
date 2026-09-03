# GRAM-X Offline & Low-Bandwidth Resilience

## 1. Network Status Monitoring
- `networkService.ts` tracks connection transitions (`ONLINE`, `WEAK_CONNECTION`, `OFFLINE`).
- `NetworkIndicator.tsx` provides non-intrusive sticky banners informing users of network conditions.

## 2. Local Draft Auto-Save
- Complaint text, category, priority, and coordinates are automatically saved to `localStorage` as the citizen types.
- If network drops, drafts are preserved and restored with 1-click on reload.

## 3. Honest Offline Guarantees
- The application never displays false "Submitted" messages when disconnected.
- Submissions remain queued in drafts until acknowledged by the Supabase PostgreSQL database.

## 4. PWA Caching Policy
- Service Worker (`sw.js`) caches static shell assets (HTML, CSS, JS, SVG).
- Dynamic queries and authenticated Supabase endpoints bypass the service worker cache to ensure data freshness and security.
