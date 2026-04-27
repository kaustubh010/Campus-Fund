<div align="center">

# CampusFund

**Transparent campus crowdfunding — locked on-chain until it matters.**

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Algorand](https://img.shields.io/badge/Algorand-000000?style=flat&logo=algorand&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)

*Built at Hacknovate 7.0 · 1st Runner-Up · Algorand Track*

</div>

---

## Running locally

**Prerequisites:** Node.js ≥ 20, pnpm, PostgreSQL ≥ 15

```bash
git clone https://github.com/kaustubh010/Campus-Fund.git
cd Campus-Fund
pnpm install
cp .env.example .env     # fill in values — see below
npx prisma migrate dev
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment variables

```env
# Database Configuration
DATABASE_URL="your-database-url"

# Algorand Configuration
NEXT_PUBLIC_ALGORAND_NETWORK="testnet"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

GROQ_API_KEY="your-groq-api-key"
```

---

## Architecture & flow

```
User pays ── ALGO via Pera Wallet ──────────────────────┐
         └── ₹ via UPI (Razorpay) ──▶ server generates  │
                                       throwaway keypair │
                                       funds it from     │
                                       platform pool ────┘
                                              │
                                              ▼
                           Campaign smart contract
                        (one deployed per campaign)
                     app address = escrow wallet on Algorand
                     balance visible to anyone on Algoexplorer
                                              │
                                    goal reached?
                                              │
                                              ▼
                         Creator uploads invoice (PDF / image)
                         Groq Vision extracts GSTIN from doc
                         Server verifies GSTIN vs govt database
                         Creator signs set_invoice_verified() ── Pera
                         Creator signs claim_with_invoice()   ── Pera
                           └─ invoiceAmount  ──▶  creator wallet
                           └─ surplus stays in escrow
                                              │
                                              ▼
                         Donors notified ──▶ each claims individually
                         Donor signs claim_refund() ── Pera Wallet
                           └─ proportional share ──▶ donor wallet
                                              │
                                              ▼
                         All refunds done ──▶ creator calls cleanup()
                         Escrow closes · balance = 0 on Algoexplorer
```

**Key files in `/lib`:**
```
contracts/        PyTEAL source · compiled TEAL · ABI JSON
algorand.ts       Algod + Indexer client singletons
perawallet.ts     Pera Wallet connect + transaction signing
contract.ts       All contract calls (deploy, donate, claim, refund, cleanup)
auth.ts           Lucia auth config + validateRequest()
google.ts         Arctic Google OAuth flow
gst.ts            GSTIN verification against gstincheck API
invoiceExtract.ts Groq Vision OCR — extracts GSTIN from invoice
razorpay.ts       Razorpay client + webhook signature verification
conversion.ts     INR ↔ ALGO ↔ USD helpers
notifications.ts  createNotification() + createBulkNotifications()
prisma.ts         Prisma client singleton
```

---

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 15 · TypeScript · Tailwind CSS · Framer Motion · Zustand |
| Auth | Lucia Auth · Arctic (Google OAuth) · bcryptjs |
| Blockchain | Algorand · algosdk · algokit-utils · Pera Wallet · PyTEAL |
| Payments | Razorpay (UPI) · CoinDCX sandbox (INR → ALGO) |
| AI / OCR | Groq Vision API |
| Database | PostgreSQL · Prisma ORM |
| Storage | Cloudinary |

---

## Authors

<div align="center">

| <img src="https://avatars.githubusercontent.com/u/98745930?v=4" width="60" style="border-radius:50%"/> | <img src="https://avatars.githubusercontent.com/u/229663826?v=4" width="60" style="border-radius:50%"/> | <img src="https://avatars.githubusercontent.com/u/237179240?v=4" width="60" style="border-radius:50%"/> |
|:---:|:---:|:---:|
| **Kaustubh Bhardwaj** | **Anshul Soni** | **Goldy Choudhary** |
| [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github)](https://github.com/kaustubh010) | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github)](https://github.com/Sonijianshul256) | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github)](https://github.com/Goldy0012) |

</div>