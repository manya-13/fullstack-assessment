# Stackline Full Stack Assignment – Manya Achanta

## Getting Started

```bash
yarn install
yarn dev
```

---

## Overview of Changes

I reviewed the application and identified 9 bugs spanning through functionality, UX, and code quality. Below I document each issue, the fix applied, and the reasoning behind my approach.

---

## Bugs Found & Fixed

### 1. Security: XSS Risk via JSON in URL Parameters

**Files:** `app/page.tsx`, `app/product/page.tsx`

**Problem:** The product list page was passing the entire product object as a JSON-serialized URL query parameter (`?product={...}`), and the product detail page was calling `JSON.parse()` on that untrusted string. This means any data in the product object (e.g. `title`, `featureBullets`) could contain malicious payloads that travel through the URL and get executed or processed unsafely on the client. Even if React escapes output in most cases today, routing full serialized objects through URLs is a poor security boundary and a code smell.

**Fix:** Changed the product link to pass only the `stacklineSku` (`/product?sku=...`) and updated the product detail page to fetch the full product from the existing `/api/products/[sku]` endpoint, which was already built and just not being used.

**Why this approach:** Fetching by SKU from the API is the standard, safe pattern. It avoids putting untrusted data in the URL, makes URLs shareable and bookmarkable, and keeps the product detail page independent of what the list page happens to have in memory.

---

### 2. UX / Critical: Price Not Displayed Anywhere

**Files:** `app/page.tsx`, `app/product/page.tsx`, `lib/products.ts`

**Problem:** The `Product` interface in both page files and in `lib/products.ts` was missing the `retailPrice` field entirely. As a result, no price was shown on product cards or on the product detail page — a critical gap for any eCommerce UI.

**Fix:** I added `retailPrice: number` to the `Product` interface in `lib/products.ts` and both page-level interfaces. Displayed the formatted price on product cards (between the title and category badges) and prominently on the product detail page (below the title). Both render as `$X.XX` using `.toFixed(2)`.

**Why this approach:** Price is one of the most important data points on any product listing. The data was already present in `sample-products.json`, the interface just needed to expose it.

---

### 3. Functionality: Subcategory Filter Not Scoped to Selected Category

**File:** `app/page.tsx`

**Problem:** When a category was selected, the subcategory fetch called `/api/subcategories` with no query parameter, returning subcategories from all categories rather than just the selected one. The API route already supported a `?category=` parameter (the `productService.getSubCategories(category)` method used it), but the frontend wasn't passing it.

**Fix:** I changed the fetch call to `/api/subcategories?category=${encodeURIComponent(selectedCategory)}`.

**Why this approach:** The API already handled filtering correctly and the client just wasn't using it. One-line fix with correct `encodeURIComponent` to handle categories with spaces or special characters.

---

### 4. Functionality / UX: No Error Handling on Fetch Calls

**File:** `app/page.tsx`

**Problem:** All three `useEffect` fetch calls (categories, subcategories, products) had no `.catch()` handlers. If any request failed due to a network error or server issue, the promise rejection was silently swallowed, the loading spinner for products would spin indefinitely, and the user would have no way to know or recover.

**Fix:**
- a `.catch()` to all three fetch calls.
- a `error` state to the component.
- When the products fetch fails, the error is shown to the user with a "Retry" button that re-runs the fetch.
- The loading state is always reset to `false` in both success and error paths.

**Why this approach:** Failing visible is better than failing silent. A user who sees "Failed to load products. Try again." can act on it; a user who sees an infinite spinner cannot.

---

### 5. Functionality: Search Fires an API Call on Every Keystroke

**File:** `app/page.tsx`

**Problem:** The `search` state was directly in the `useEffect` dependency array for the products fetch. Every single keystroke triggered a new API request, which is wasteful, can cause race conditions, and creates a poor UX on slower connections.

**Fix:** I added a separate `debouncedSearch` state and a 300ms debounce using `setTimeout` / `clearTimeout` in a dedicated `useEffect`. The products fetch depends on `debouncedSearch` rather than `search`.

**Why this approach:** 300ms is the standard debounce interval for search inputs which is long enough to avoid firing mid-word but short enough to feel responsive. Using a ref to track the timer ensures cleanup on unmount.

---

### 6. Functionality: Input Validation Missing on Products API

**File:** `app/api/products/route.ts`

**Problem:** The `limit` and `offset` query parameters were parsed with `parseInt()` but not validated. A caller could pass `?limit=-1`, `?limit=999999`, or `?limit=abc` (which becomes `NaN`), all of which would be passed to the service layer unchecked, potentially returning an empty array, crashing, or leaking the entire dataset.

**Fix:** I added explicit validation: `isNaN` check falls back to a safe default; `Math.max` and `Math.min` clamp `limit` to 1–100 and `offset` to ≥ 0.

**Why this approach:** API inputs should always be validated at the boundary before touching business logic. The values are also clamped in `lib/products.ts` (`getAll`) as a defense-in-depth measure.

---

### 7. Data Layer: Missing Bounds Enforcement in `getAll`

**File:** `lib/products.ts`

**Problem:** `getAll()` accepted whatever `limit` and `offset` values were passed without any floor or ceiling. A negative `offset` would cause `Array.slice` to behave unexpectedly.

**Fix:** I applied `Math.max(0, offset)` and `Math.min(limit, 100)` before slicing.

**Why this approach:** Defense-in-depth. Even if the route handler validates inputs, the service layer shouldn't trust its callers unconditionally.

---

### 8. UX: Product Detail Page Had No Loading State

**File:** `app/product/page.tsx`

**Problem:** After switching from JSON parsing to API fetching, the page needed a loading state for the async request. Without one, the page would flash "Product not found" briefly on every load before the data arrived.

**Fix:**  I added a `loading` boolean state. While loading, the page renders a "Loading product..." placeholder card instead of the error state.

**Why this approach:** Async data fetching always needs three states handled: loading, error, and success. Previously only error and success were covered.

---

### 9. Accessibility: Thumbnail Buttons Missing Labels and Focus Styles

**File:** `app/product/page.tsx`

**Problem:** The image thumbnail buttons had no `aria-label`, so screen readers would only announce "button" with no context. There was also no visible focus ring, making keyboard navigation difficult.

**Fix:**  I added `aria-label="View image X of Y"` and `aria-current` on the active thumbnail. Added `focus:outline-2 focus:outline-offset-2 focus:outline-primary` Tailwind classes for a visible keyboard focus indicator.

**Why this approach:** Accessibility is part of code quality, not an afterthought. These are low-cost fixes that meaningfully improve the experience for keyboard and screen reader users.

---




