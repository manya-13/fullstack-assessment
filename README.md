# Stackline Full Stack Assignment – Manya Achanta

## Getting Started

```bash
yarn install
yarn dev
```

---

## Overview

I intially tested the app by going through the main flows by browsing the products, filtering by category and subcategory, searching, and viewing product detail pages. I found 9 bugs across security, functionality, and UX. Below is a summary of each bug, what I changed, and why.

---

## Bugs Found & Fixed

### 1. Security: Full Product Data Was Being Passed Through the URL

**Files:** `app/page.tsx`, `app/product/page.tsx`

**Problem:** When clicking on a product, the entire product object was converted to a JSON string and put into the URL. The product detail page then read that string back out of the URL and parsed it. This is a security risk because URLs can be modified by anyone — someone could craft a malicious URL with harmful content in the product fields.

**Fix:** Changed the link to only pass the product's SKU in the URL (`/product?sku=...`). The detail page now fetches the full product data from the API using that SKU. There was already an API endpoint built for this — it just wasn't being used.

**Why:** Passing only an ID through the URL and fetching the actual data from the server is the standard safe approach. It also makes the URL cleaner and shareable.

---

### 2. Price Was Not Shown Anywhere on the App

**Files:** `app/page.tsx`, `app/product/page.tsx`, `lib/products.ts`

**Problem:** No price was displayed on the product listing cards or on the product detail page. The price data (`retailPrice`) existed in the data file but was never included in the TypeScript interface, so the app didn't know about it and never showed it.

**Fix:** Added `retailPrice` to the product interface and displayed it on both the product cards and the detail page, formatted as `$X.XX`.

**Why:** Price is one of the most basic pieces of information on any eCommerce site. This was missing entirely.

---

### 3. Subcategory Dropdown Showed All Subcategories, Not Just the Relevant Ones

**File:** `app/page.tsx`

**Problem:** When you selected a category (e.g. "Tablets"), the subcategory dropdown still showed subcategories from every category in the app. This happened because the frontend was calling `/api/subcategories` without telling it which category was selected.

**Fix:** Updated the fetch call to include the selected category: `/api/subcategories?category=Tablets`. The backend already supported this — the frontend just wasn't sending the right information.

**Why:** It was a one-line fix. The subcategory list should only show options relevant to the selected category.

---

### 4. App Showed a Spinning Loader Forever If Something Went Wrong

**File:** `app/page.tsx`

**Problem:** If any of the three API calls (categories, subcategories, products) failed — for example due to a network issue — the error was silently ignored. The loading spinner for products would never stop, and the user had no way to know something went wrong or try again.

**Fix:** Added error handling to all three fetch calls. If the products request fails, the app now shows an error message and a "Retry" button. The loading spinner always stops whether the request succeeds or fails.

**Why:** Users should always get feedback when something goes wrong, and should have a way to recover.

---

### 5. Typing in the Search Box Sent Too Many API Requests

**File:** `app/page.tsx`

**Problem:** Every single keystroke in the search box triggered a new API request. Typing "kindle" would send 6 separate requests — one for each letter.

**Fix:** Added a 300ms delay (called a "debounce") so the API request only fires after the user pauses typing, not on every keystroke.

**Why:** This reduces unnecessary network requests and improves performance. 300ms is short enough that the search still feels instant.

---

### 6. API Did Not Validate the `limit` and `offset` Parameters

**File:** `app/api/products/route.ts`

**Problem:** The products API accepted `limit` and `offset` as URL parameters but never checked if they were valid. Someone could pass `?limit=-1` or `?limit=abc` and the app would pass those bad values straight to the database query without checking.

**Fix:** Added validation so that non-numeric values fall back to safe defaults, `limit` is capped between 1 and 100, and `offset` cannot go below 0.

**Why:** API inputs should always be validated before being used. Bad inputs should fail safely, not cause unexpected behavior.

---

### 7. The Data Layer Also Didn't Protect Against Bad `limit` and `offset` Values

**File:** `lib/products.ts`

**Problem:** The `getAll()` function in the data layer accepted whatever `limit` and `offset` values it received without any checks. A negative `offset` would cause JavaScript's `Array.slice` to behave unexpectedly.

**Fix:** Added the same clamping (`Math.max`, `Math.min`) inside `getAll()` as a second layer of protection.

**Why:** Even if the API route validates inputs, the data layer should not assume its inputs are always safe. Defense-in-depth is good practice.

---

### 8. Product Detail Page Briefly Showed "Product Not Found" on Every Load

**File:** `app/product/page.tsx`

**Problem:** After fixing Bug 1, the product detail page now fetches data from the API instead of reading it from the URL. But there was no loading state, so during the brief moment before the data arrived, the page flashed "Product not found" every time.

**Fix:** Added a loading state. While the data is being fetched, the page shows "Loading product..." instead of the error message.

**Why:** Any page that loads data asynchronously needs to handle three states: loading, error, and success. The original code only handled two.

---

### 9. Image Thumbnail Buttons Were Not Accessible

**File:** `app/product/page.tsx`

**Problem:** The small thumbnail images on the product detail page are clickable buttons, but they had no labels. A screen reader would just say "button" with no description. There was also no visible focus indicator when navigating by keyboard.

**Fix:** Added `aria-label="View image X of Y"` to each button so screen readers can describe them. Also added a visible outline that appears when the button is focused via keyboard.

**Why:** Accessibility should be treated as a basic requirement, not an optional extra. These were small, low-effort fixes with a real impact.

---
