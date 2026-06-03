---
title: 'Fix embedded resume PDF not rendering in file preview pane'
type: 'bugfix'
created: '2026-06-03'
status: 'done'
context: []
baseline_commit: '4d78e07515fff884fe571746a2c73a4624c245a5'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Sources → `resume.pdf` preview shows a blank/spinner area instead of the PDF, even though `/hossam-marey-resume.pdf` exists and the URL is correct. The CSP and framing headers added in story 7.5 (`next.config.mjs`) block embedded same-origin PDFs via three mechanisms: `object-src 'none'` (blocks the `<embed>` element), `frame-ancestors 'none'`, and `X-Frame-Options: DENY` (both forbid the PDF document from being framed by anyone, including same-origin).

**Approach:** Swap the `<embed>` for an `<iframe>` (governed by `frame-src`/`default-src 'self'`, so `object-src 'none'` hardening stays intact), and relax the two framing headers from "deny all" to "same-origin only" (`frame-ancestors 'self'`, `X-Frame-Options: SAMEORIGIN`) in both the dev and prod CSP.

## Boundaries & Constraints

**Always:** Keep `object-src 'none'`. Apply the same change to both `devCsp` and `prodCsp`. Preserve the existing download link and accessibility attributes (title, sized container). `SAMEORIGIN` must still block cross-origin clickjacking.

**Ask First:** Any further loosening of CSP beyond same-origin framing (e.g. `frame-ancestors *`, allowing external origins, relaxing `object-src`).

**Never:** Remove the security headers entirely, set `X-Frame-Options: ALLOWALL`, host the PDF off-origin, or add a heavyweight PDF.js viewer dependency.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Resume node selected | `item.id === "resume"` | Inline `<iframe>` renders the PDF in the browser's native viewer; download link visible above it | N/A |
| Browser cannot inline-render PDF | iframe unsupported / mobile | Download link remains the reliable fallback | Graceful — link always present |
| Cross-origin framing attempt | Another site iframes our pages | Blocked by `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN` | Browser refuses to frame |

</frozen-after-approval>

## Code Map

- `next.config.mjs` -- defines `prodCsp` / `devCsp` arrays and the `X-Frame-Options` header; source of all three blocking directives.
- `components/file-preview-pane.tsx` -- renders the `<embed>` for the resume node (lines 35–40); element to swap to `<iframe>`.
- `public/hossam-marey-resume.pdf` -- the asset (exists, 124 KB); no change.

## Tasks & Acceptance

**Execution:**
- [x] `next.config.mjs` -- in both `prodCsp` and `devCsp`, change `"frame-ancestors 'none'"` → `"frame-ancestors 'self'"`; change the `X-Frame-Options` header value `"DENY"` → `"SAMEORIGIN"`. Leave `object-src 'none'` and all other directives unchanged. -- unblocks same-origin framing of the PDF while retaining clickjacking protection.
- [x] `components/file-preview-pane.tsx` -- replace the `<embed src="/hossam-marey-resume.pdf" type="application/pdf" ...>` with an `<iframe src="/hossam-marey-resume.pdf" title="Hossam Marey resume PDF" className="...same classes...">`; keep the surrounding download link unchanged. -- iframe is governed by `frame-src` (allowed via `default-src 'self'`), so the PDF renders without relaxing `object-src`.
- [x] `components/file-preview-pane.test.tsx` -- update the resume-item assertion from `<embed>`+`type` to `<iframe>`+`title`. -- keeps the co-located test aligned with the element swap (surfaced by the pre-commit test gate).

**Acceptance Criteria:**
- Given the dev server is running, when I open Sources and select `resume.pdf`, then the PDF renders inline inside the bordered container (no blank/spinner state).
- Given any page response, when inspected, then `Content-Security-Policy` contains `frame-ancestors 'self'` and `object-src 'none'`, and `X-Frame-Options` is `SAMEORIGIN`.
- Given the resume preview, when rendered, then the "Download resume.pdf" link is still present and functional.

## Spec Change Log

- **2026-06-03 (patch, surfaced by pre-commit test gate):** `components/file-preview-pane.test.tsx` asserted an `<embed>` with `type="application/pdf"`; the element swap to `<iframe>` correctly broke it. Updated the test to assert the `<iframe>` (`src` + `title`). The spec's task list should have listed the co-located test up front — minor gap, no impact on intent. KEEP: iframe + same-origin-framing approach is correct and unchanged.

## Design Notes

Why iframe over relaxing `object-src`: `<embed>`/`<object>` are gated by `object-src`, so keeping them would force `object-src 'self'` (a broader plugin-content allowance). `<iframe>` is gated by `frame-src` (inherits `default-src 'self'`), so switching the element lets us keep `object-src 'none'` and only touch the framing headers. Both header and element changes are required together — relaxing the headers alone leaves `object-src 'none'` blocking the old `<embed>`, and switching to iframe alone leaves `frame-ancestors 'none'`/`DENY` blocking the PDF document.

## Verification

**Commands:**
- `npm run build` -- expected: compiles with no errors.
- `npm run lint` -- expected: no new lint errors in the two changed files.

**Manual checks:**
- `npm run dev`, open the Sources tab, select `resume.pdf` → PDF renders inline. DevTools → Network/Console shows no CSP violation for the PDF; Response headers on a page show `X-Frame-Options: SAMEORIGIN` and CSP with `frame-ancestors 'self'`.

## Suggested Review Order

**Framing headers (root cause)**

- Embedder element switched to `<iframe>` so `object-src 'none'` stays intact while the PDF renders.
  [`file-preview-pane.tsx:35`](../../components/file-preview-pane.tsx#L35)

- Allow same-origin framing of the PDF document (prod CSP); clickjacking still blocked.
  [`next.config.mjs:8`](../../next.config.mjs#L8)

- Same relaxation mirrored in the dev CSP.
  [`next.config.mjs:21`](../../next.config.mjs#L21)

- Legacy header aligned with CSP: `DENY` → `SAMEORIGIN`.
  [`next.config.mjs:50`](../../next.config.mjs#L50)
