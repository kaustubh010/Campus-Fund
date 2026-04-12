# Refunds, multi-invoice (OCR), soft cancel vs purge

## Decisions (from you)

- **Invoice amounts**: Automatic **OCR / document extraction** per upload, with creator review before totals are locked for claim.
- **Hard delete**: No new `ADMIN` role — **same company account**, separate **“Purge”** (danger zone) that removes the campaign and related DB rows everywhere. **Campaign `[id]` page** uses **soft cancel** only.

---

## 1. Soft cancel (campaign detail `[id]` page)

**Behaviour**

- Creator runs the **same on-chain flow** as today: `delete_campaign` (refund donors + delete app) when there are funds, or DB-only when chain is empty.
- **After successful finalize**: do **not** call `hardDeleteCampaignRecords`.
- **DB update**: `status: 'cancelled'`, set `deletedAt` / `deleteTxId` as today, clear or retain `appId` for audit (recommend **keep** `appId` + `deleteTxId` for support; app is gone on-chain so GET should not rely on live app fetch for cancelled rows).

**API / UI**

- Add dedicated route e.g. `POST /api/campaigns/[id]/cancel` with actions `prepare` | `finalize` (mirror delete route logic) **or** branch `POST .../delete` with `?mode=soft` / body `softCancel: true` so finalize updates DB instead of purge.
- `[id]` page: call **soft cancel** endpoint only; remove path that ends in hard `DELETE /api/campaigns/[id]` for this page.
- Listings / GET: return cancelled campaigns where appropriate; hide from public “active” lists if desired.

---

## 2. Hard purge (company dashboard — separate action)

**Behaviour**

- **“Purge campaign”** (copy + confirm modal): only when safe or after user accepts risk:
  - If **on-chain funds remain** (`total_raised > 0` and app exists): either **block** purge until on-chain cancel/refund completed, or run prepare+sign flow first then purge — recommend **block** with message: “Cancel on-chain first” unless you explicitly want server-side only (not possible for custodial refund without creator wallet).
  - If **no funds / already cancelled / no app**: `hardDeleteCampaignRecords` (existing helper).

**API**

- e.g. `DELETE /api/campaigns/[id]/purge` with strict creator check + extra confirmation token or `confirm: campaignTitle` in body.
- Keep generic `DELETE /api/campaigns/[id]` for **empty-chain DB cleanup** or deprecate in favour of purge-only to avoid accidents.

---

## 3. Remove GST verification; multiple invoices + OCR

**Remove / retire**

- GST-specific fields and flows where they only served verification (e.g. GST API verify step, `gstVerified` gating claim if that’s all it does).
- Single `invoiceUrl` as the **only** document: replace with **many-to-one** `CampaignInvoice` (or equivalent) records.

**Data model (conceptual)**

- `CampaignInvoice`: `id`, `campaignId`, `fileUrl`, `publicId` (Cloudinary), `mimeType`, `extractedAmountINR` (and/or micro ALGO), `extractedAt`, `ocrRawText` optional, `status` (`pending_review` | `accepted` | `rejected`), `creatorConfirmedAt`.
- **Campaign**: `totalInvoiceAmountINR` / `totalInvoiceAmountMicroALGO` (computed sum of **accepted** lines), fields used for claim replace single-invoice GST outputs.

**OCR pipeline (v1)**

- **Upload** → store file → **server job** calls OCR provider (choose one in implementation: e.g. **Google Document AI**, **AWS Textract**, or **OpenAI vision** for images/PDF first page — document in `.env` and cost).
- Persist **suggested** amount per file; UI shows **editable** amount before creator marks invoice line **accepted**.
- **No on-chain step** until creator locks **total** invoice amount (sum of accepted lines) and (if you keep a safety check) `total <= total_raised` on chain.

**On-chain**

- Still a **single** `invoice_amount` + `invoice_verified` in TEAL; backend builds **one** `set_invoice_verified` txn with **sum** of accepted micro-ALGO totals (aligned with existing contract).

**Public trust**

- GET `/api/campaigns/[id]` (and page): include **non-sensitive** invoice list for **all** visitors: URLs/thumbnails, **accepted** amounts, maybe status; **do not** expose internal OCR errors verbatim to other users (log server-side).

**Claim**

- Claim **prepare** uses summed **accepted** invoice micro total + same surplus/refund logic as today, after removing GST-specific gates.

---

## 4. Flawless fair refunds (“wallet they paid from”)

**Donation record**

- On `/api/campaigns/[id]/donate` **finalize**, parse the **confirmed** group txn (or indexer lookup): read **payment sender** and **payment amount** in micro-ALGO; persist on `Donation`: `donorWalletAddress` (required), amounts from chain (ignore or cross-check client body).
- `buildRefundPlan` input: use **`donation.donorWalletAddress` first**, fallback `donor.walletAddress` for legacy rows; **fail prepare** with clear 400 if any in-scope donation lacks address when refunds > 0.

**Aggregation**

- Keep pro-rata by **micros contributed per address** (merge same wallet multiple donations) for **delete** full refund and **claim** surplus — now addresses are chain-verified.

**Dust / “too low per donor” (no on-chain runtime errors)**

- **Claim (`claim_with_invoice`)**: Contract already allows `sum(refund_args) <= distributable`; remainder goes to creator on **close**. Implementation: **omit** inner payments where `microAlgos < 1`; dust stays in account and flows to creator on close. Ensure TEAL / grouping still satisfies `load0 <= load2` with **adjusted** sum.
- **Delete (`delete_campaign`)**: Today TEAL asserts `sum(refund_args) == total_raised`. **Change contract** to `sum(refund_args) <= total_raised` (or `==` only for amounts ≥1 micro and explicit rule for remainder to creator on close) so **micro-dust** does not force invalid 0-µALGO inner txns and creator absorbs remainder **without assert failure**.

---

## 5. Contract file changes ([lib/contracts/crowdfund_approval.teal](lib/contracts/crowdfund_approval.teal))

- Relax **delete** sum assert as above; document invariants.
- **Claim** refund loop: skip inner txn when parsed amount is 0 (if not already safe); verify **max inner tx count** vs Algorand limits.
- Recompile / redeploy story: new apps only; document migration for **existing** live apps (may need old behaviour flag or accept only new campaigns use new TEAL).

---

## 6. UI / UX touchpoints

| Area | Change |
|------|--------|
| Campaign `[id]` | Cancel → soft DB; copy for cancelled state; invoice gallery (read-only for visitors); creator: upload many, review OCR, accept lines, see running total |
| Company dashboard | List campaigns; **Purge** separate from **Cancel**; purge confirms title |
| Claim flow | Gate on “accepted invoice total” + on-chain `invoice_verified`; remove GST step UI |
| Donate | Ensure wallet connected; show “refunds return to this wallet” |

---

## 7. API summary

| Endpoint | Role |
|----------|------|
| `POST .../invoices` (multipart) | Creator upload → OCR → `CampaignInvoice` pending |
| `PATCH .../invoices/[invId]` | Creator adjust amount / accept |
| `GET .../campaigns/[id]` | Public + creator; includes invoice list |
| `POST .../cancel` (prepare/finalize) | Creator soft cancel after chain |
| `DELETE .../purge` | Creator hard purge (guarded) |
| `POST .../claim` | Remove GST checks; use summed invoice |
| `POST .../donate` | Parse chain for payer + micro amount |

---

## 8. Implementation order (suggested)

1. Donation finalize: chain-parse + `donorWalletAddress` required; tighten `buildRefundPlan` + prepare guards.
2. TEAL delete assert + zero-skip inner pays; regen contract bytes / deploy notes.
3. TEAL claim zero-skip if needed; verify close path.
4. `CampaignInvoice` + migrations; OCR service wrapper; upload + list APIs.
5. Remove GST from verify route / UI; wire claim to summed totals + single `set_invoice_verified`.
6. Soft cancel API + `[id]` page wiring; dashboard **Purge** + purge route.
7. QA matrix: N donors, mixed wallets, 1µ dust, claim surplus, delete full refund, cancelled visibility.

---

## 9. Risks / follow-ups

- **OCR wrong**: creator must edit before accept; show confidence only if API provides it.
- **Existing campaigns**: old donations without payer snapshot — migration script or one-time “link wallet” for refund eligibility.
- **Legal**: public invoice URLs may contain PII — consider redacted public copy vs full URL for donors only (future).
