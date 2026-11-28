# Next.js Cache Components & React Rules

This project uses **Next.js 16 with Cache Components (`cacheComponents: true`)** and **React Compiler ESLint rules** (`react-hooks/set-state-in-effect`). Follow these rules on every Client Component and route:

1. **Never call `new Date()` (or `Date.now()`) during Client Component render or inside `useMemo` / JSX.**
   - Calling `new Date()` during render triggers `blocking-prerender-current-time-client` during Next.js prerendering.
   - Always capture the current date inside `useEffect` (inside an async `.then(...)` callback) or inside an event handler, and pass that `Date | null` state into `useMemo` or helper functions.
   - Pure date helpers (like `resolveDateRange`) must accept `referenceDate: Date | null` rather than calling `new Date()` internally.

2. **Never call `setState` synchronously inside `useEffect`.**
   - Avoid calling async helper functions that synchronously invoke `setState` (e.g., `setLoading(true)`) at the top of `useEffect`.
   - Perform `fetch`/`api.*` calls directly with `.then(...)` / `.catch(...)` / `.finally(...)` and a `cancelled` cleanup flag, or set initial loading state in event handlers rather than inside `useEffect`.

3. **Keep `useEffect` dependency arrays fixed in size and order.**
   - Never conditionally change the length of a `useEffect` dependency array between renders.
