<div align="center">

<br/>

```
  ██████╗ █████╗ ███╗   ███╗██████╗ ██╗   ██╗███████╗███████╗██╗   ██╗███╗   ██╗██████╗
 ██╔════╝██╔══██╗████╗ ████║██╔══██╗██║   ██║██╔════╝██╔════╝██║   ██║████╗  ██║██╔══██╗
 ██║     ███████║██╔████╔██║██████╔╝██║   ██║███████╗█████╗  ██║   ██║██╔██╗ ██║██║  ██║
 ██║     ██╔══██║██║╚██╔╝██║██╔═══╝ ██║   ██║╚════██║██╔══╝  ██║   ██║██║╚██╗██║██║  ██║
 ╚██████╗██║  ██║██║ ╚═╝ ██║██║     ╚██████╔╝███████║██║     ╚██████╔╝██║ ╚████║██████╔╝
  ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝╚═════╝
```

### **Your campus. Your cause. Locked on-chain until it matters.**

*Transparent campus crowdfunding powered by Algorand blockchain escrow*

<br/>

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Algorand](https://img.shields.io/badge/Algorand-000000?style=for-the-badge&logo=algorand&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

<br/>

> **Built at a hackathon. Deployed with proof. Trusted by code.**

<br/>

</div>

---

## 📌 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [How It Works](#-how-it-works)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Role System](#-role-system)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Algorand Escrow Design](#-algorand-escrow-design)
- [Business Model](#-business-model)
- [Authors](#-authors)

---

## 🚨 The Problem

Campus fundraising runs on **trust** — and trust keeps failing.

Student clubs collect money via UPI links and WhatsApp messages with zero accountability. Donors have no way to verify if their ₹500 ever reached the cause. Goals are never enforced — a campaign raises 30% of its target and spends it anyway. There is no refund mechanism, no audit trail, and no recourse.

| What's broken | The reality |
|---|---|
| **Fund accountability** | Money collected via UPI with no tracking after transfer |
| **Goal enforcement** | Campaigns spend partial funds with zero donor protection |
| **Transparency** | Only the treasurer knows where the money went |
| **Trust** | Every new campaign starts from zero credibility |
| **Refunds** | Non-existent — donors have no recourse if goal fails |

> *47 lakh registered NGOs in India. Less than 10% file audited accounts.*

---

## ✅ Our Solution

**CampusFund fixes this at the infrastructure level, not the policy level.**

Every donation is locked in an **Algorand escrow wallet** the moment it's sent. The funds are mathematically unreachable until the campaign hits its goal — no human can touch them early, no admin can override it, no exception exists. When the goal is met, the campaign creator can claim. If it fails, donors are refunded. Automatically. By code.

```
Donor sends ₹500   →   Algorand locks it in 4 seconds at ~0.001 ALGO fee
Goal reached       →   Creator claims instantly, on-chain sweep
Goal fails         →   Donors refunded automatically, zero friction
Anyone audits      →   Every rupee on public ledger, forever
```

---

## 🔄 How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Sign up   │────▶│  Connect Wallet  │────▶│   Browse Campaigns  │
│  (as User)  │     │  (Pera Wallet)   │     │   & Donate via ALGO │
└─────────────┘     └──────────────────┘     └─────────────────────┘
                                                         │
                    ┌──────────────────┐                 ▼
                    │  Funds Released  │◀────  ┌─────────────────────┐
                    │  to Creator      │       │  Escrow locks funds  │
                    │  (Goal Met ✓)    │       │  on Algorand chain   │
                    └──────────────────┘       └─────────────────────┘
                            │
                    ┌───────▼──────────┐
                    │  Auto-refund     │
                    │  (Goal Failed ✗) │
                    └──────────────────┘

Want to CREATE campaigns?
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  User Acct  │────▶│  Upgrade to      │────▶│  Create Campaigns,  │
│  (Donor)    │     │  Company Acct    │     │  Access Dashboard   │
└─────────────┘     │  (/upgrade)      │     │  Donor Analytics    │
                    └──────────────────┘     └─────────────────────┘
```

---

## ⚡ Features

### 👤 For Users (Donors)
- **Trustless donations** — funds locked on-chain, not held by us
- **Pera Wallet integration** — connect and donate in seconds
- **Multi-currency display** — every amount shown in ₹ · $ · ALGO simultaneously
- **Donation history** — full transaction log with Algoexplorer links
- **Auto-refund protection** — funds returned automatically if campaign fails

### 🏢 For Companies (Campaign Creators)
- **Campaign creation** — multi-step form with live INR → ALGO conversion
- **Per-campaign escrow** — unique Algorand keypair generated per campaign
- **Goal enforcement** — claim button activates only at 100% funded
- **Company dashboard** — overview cards, campaign manager, status tracking
- **Donor analytics** — per-campaign donor tables, exportable as CSV
- **Audit trail** — immutable on-chain event log (Deposit / Claim / Refund)
- **Subscription tiers** — Starter / Pro / Enterprise with usage limits

### 🔐 Platform-wide
- Full authentication (NextAuth — sessions + JWT)
- Role-based access control (user vs company) enforced at middleware + API level
- Wallet connection persisted across sessions
- Responsive dark-themed UI (Syne + DM Sans + JetBrains Mono)
- Dot-grid background, gradient progress bars, animated card transitions

---

## 🛠️ Tech Stack

### Frontend
| Tool | Version | Purpose |
|---|---|---|
| Next.js | 15.x | React framework, App Router, SSR, API routes |
| TypeScript | 5.x | Type safety across the entire codebase |
| Tailwind CSS | 4.x | Utility-first styling |
| Framer Motion | latest | Page transitions, card animations, staggered reveals |
| Zustand | 5.x | Global state (wallet address, balance, conversion rate) |
| React Hook Form + Zod | latest | Form validation with type-safe schemas |

### Blockchain
| Tool | Purpose |
|---|---|
| `algosdk` | Algorand transaction building and signing |
| `@algorandfoundation/algokit-utils` | Algod client, account management |
| `@perawallet/connect` | Pera Wallet modal, session management |
| Algorand TestNet | Development and demo environment |

### Backend & Database
| Tool | Purpose |
|---|---|
| PostgreSQL | Primary relational database |
| Prisma ORM | Type-safe DB access, migrations, relations |
| NextAuth | Authentication — Google + email/password |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | Secure session tokens |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CAMPUSFUND                              │
│                     Next.js 15 Frontend                         │
│              (App Router · SSR · API Routes)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
           ┌─────────────┴──────────────┐
           ▼                            ▼
┌─────────────────────┐      ┌──────────────────────┐
│    ALGORAND CHAIN   │      │   POSTGRESQL + PRISMA │
│                     │      │                       │
│  • Per-campaign     │      │  • User accounts      │
│    escrow keypairs  │      │  • Company profiles   │
│  • 4 sec finality   │      │  • Campaign metadata  │
│  • ~0.001 ALGO fee  │      │  • Donation records   │
│  • Public ledger    │      │  • Audit labels       │
│                     │      │  • Subscription plans │
│  Pera Wallet        │      │                       │
│  (client-side)      │      │  Prisma ORM           │
│  algosdk            │      │  (type-safe access)   │
│  (server-side sign) │      │                       │
└─────────────────────┘      └──────────────────────┘
           │                            │
           └─────────────┬──────────────┘
                         ▼
              ┌─────────────────────┐
              │     NEXTAUTH        │
              │                     │
              │  Sessions · JWT     │
              │  Role middleware     │
              │  Route guards        │
              └─────────────────────┘
```

---

## 🔐 Role System

CampusFund has two roles. Everyone starts as a **User**. Upgrading to **Company** is the monetisation gate.

### User (default — free forever)
- Sign up instantly, zero friction
- Connect Pera Wallet
- Browse all public campaigns
- Donate to any active campaign
- View personal donation history
- ❌ Cannot create campaigns

> **When a user tries to create a campaign**, they see a contextual upgrade prompt — not a 404. The modal explains the value, shows pricing, and offers a direct upgrade path.

### Company (paid upgrade — in-place)
- Everything a user can do, plus:
- Create unlimited campaigns (based on plan)
- Manage campaigns (edit, delete, claim)
- Full company dashboard
- Donor analytics + CSV export
- Immutable audit trail
- Subscription management

**Upgrading doesn't create a new account** — it mutates the existing user record. Role flips from `"user"` → `"company"`, a `CompanyProfile` row is created, and the session updates. Donation history and wallet connection are preserved.

| Feature | User | Company |
|---|:---:|:---:|
| Browse campaigns | ✅ | ✅ |
| Donate | ✅ | ✅ |
| Connect Pera Wallet | ✅ | ✅ |
| Create campaigns | ❌ | ✅ |
| Claim funds | ❌ | ✅ (own campaigns) |
| Company dashboard | ❌ | ✅ |
| Donor analytics | ❌ | ✅ |
| Audit trail | ❌ | ✅ |

---

## 🚀 Getting Started

### Prerequisites

```bash
node >= 20.x
npm >= 10.x   # or yarn / pnpm
PostgreSQL >= 15
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/campusfund.git
cd campusfund

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Database Setup

```bash
# Run Prisma migrations
npx prisma migrate dev --name init

# (Optional) Seed sample data
npx prisma db seed
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/campusfund"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="your-jwt-secret"

# Algorand
NEXT_PUBLIC_ALGORAND_NODE_URL="https://testnet-api.algonode.cloud"
NEXT_PUBLIC_ALGORAND_INDEXER_URL="https://testnet-idx.algonode.cloud"
ALGORAND_API_KEY=""   # leave empty for AlgoNode free tier

# WalletConnect (for Pera Wallet)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"

# Currency conversion (static rates — update as needed)
NEXT_PUBLIC_ALGO_TO_INR="12.75"
NEXT_PUBLIC_USD_TO_INR="83"
```

---

## 📁 Project Structure

```
campusfund/
├── app/
│   ├── (auth)/
│   │   ├── login/               # Login page
│   │   └── signup/              # Signup — creates user role by default
│   ├── connect-wallet/          # Pera Wallet onboarding flow
│   ├── explore/                 # Public campaign browser
│   ├── campaigns/
│   │   ├── create/              # Company only — multi-step campaign form
│   │   └── [id]/                # Campaign detail + donate + claim
│   ├── my-campaigns/            # Creator's campaign manager
│   ├── transactions/            # Donation history (both roles)
│   ├── upgrade/                 # User → Company upgrade flow + pricing
│   ├── dashboard/
│   │   ├── page.tsx             # Company overview (metrics)
│   │   ├── donors/              # Per-campaign donor analytics
│   │   ├── audit/               # On-chain audit trail
│   │   └── subscription/        # Plan management
│   ├── profile/                 # Role-aware profile page
│   └── api/
│       ├── auth/                # NextAuth handlers
│       ├── campaigns/           # CRUD + donate + claim
│       ├── user/
│       │   ├── wallet/          # PATCH — save wallet address
│       │   └── upgrade/         # PATCH — user → company upgrade
│       └── dashboard/           # Company-only analytics endpoints
├── components/
│   ├── ui/
│   │   ├── PriceDisplay.tsx     # ₹ · $ · ALGO inline display
│   │   ├── WalletChip.tsx       # Navbar wallet pill (address + balance)
│   │   ├── ProgressBar.tsx      # Gradient goal progress bar
│   │   ├── CampaignCard.tsx     # Explore grid card
│   │   ├── AlgoAddress.tsx      # Truncated address + copy + explorer
│   │   └── StatusChip.tsx       # Active / Funded / Claimed / Expired
│   ├── layout/
│   │   ├── Navbar.tsx           # Role-aware sticky navbar
│   │   └── UpgradeModal.tsx     # Contextual upgrade prompt
│   └── wallet/
│       └── WalletProvider.tsx   # Pera Wallet context (client boundary)
├── lib/
│   ├── algorand/
│   │   ├── client.ts            # Algod + Indexer client setup
│   │   ├── escrow.ts            # Keypair generation, sweep logic
│   │   └── balance.ts           # On-chain balance fetch
│   ├── auth.ts                  # NextAuth config
│   ├── prisma.ts                # Prisma client singleton
│   └── conversion.ts            # INR ↔ ALGO ↔ USD helpers
├── prisma/
│   ├── schema.prisma            # DB schema
│   └── seed.ts                  # Sample data seeder
└── middleware.ts                # Role-based route protection
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create user account |
| `POST` | `/api/auth/[...nextauth]` | NextAuth handlers |

### User
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `PATCH` | `/api/user/wallet` | User | Save connected wallet address |
| `PATCH` | `/api/user/upgrade` | User | Upgrade to company account |

### Campaigns
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/campaigns` | Public | List all campaigns (with filters) |
| `POST` | `/api/campaigns` | Company | Create campaign + generate escrow |
| `GET` | `/api/campaigns/[id]` | Public | Single campaign + donor list |
| `PATCH` | `/api/campaigns/[id]` | Company | Edit campaign |
| `DELETE` | `/api/campaigns/[id]` | Company | Delete campaign |
| `POST` | `/api/campaigns/[id]/donate` | User | Record donation metadata |
| `POST` | `/api/campaigns/[id]/claim` | Company | Sweep escrow → creator wallet |

### Dashboard (Company only)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/overview` | Metric cards data |
| `GET` | `/api/dashboard/donors` | Donor analytics per campaign |
| `GET` | `/api/dashboard/audit` | On-chain event log |

---

## 🔗 Algorand Escrow Design

This is the core technical innovation of CampusFund. No custom smart contract is required — we use Algorand's native account model.

### How the escrow works

```
1. Campaign created
   └─▶ Server generates a unique Algorand keypair (escrowAddress + encryptedMnemonic)
   └─▶ escrowAddress stored on Campaign record in DB
   └─▶ encryptedMnemonic stored server-side ONLY (never exposed to client)

2. Donor sends a contribution
   └─▶ Client: Pera Wallet signs a payment txn to escrowAddress
   └─▶ Donor's ALGO moves to escrow on-chain (4 second finality)
   └─▶ Server: records Donation row in DB with Algorand txId

3. Goal check (on each donation)
   └─▶ Server fetches live balance from Algod: escrowAddress balance
   └─▶ If balance >= campaign.goalALGO → campaign.status = "funded"
   └─▶ Claim button activates for creator

4. Creator claims
   └─▶ POST /api/campaigns/[id]/claim
   └─▶ Server validates: session.userId === campaign.creatorId
   └─▶ Server validates: on-chain balance >= goalALGO
   └─▶ Server decrypts mnemonic → signs sweep txn → broadcasts
   └─▶ Full escrow balance → creator's connected wallet
   └─▶ Campaign status → "claimed"

5. Goal failure (deadline passed, balance < goal)
   └─▶ Cron or on-visit check sets status → "expired"
   └─▶ Refund sweep: server signs individual refund txns back to each donor
       (donor wallet addresses pulled from Donation records)
```

### Security properties
- Escrow mnemonic is **never sent to the client**
- Claim requires **session match** (creatorId) + **on-chain balance check**
- Double-claim prevented by `status` field — once `"claimed"`, endpoint returns 409
- All sweep transactions signed server-side from encrypted mnemonic

---

## 💼 Business Model

| Account | Price | Campaigns | Analytics | Audit Export |
|---|---|---|---|---|
| **User** | Free forever | Donate only | Own donations | — |
| **Starter** | Free | 2 active | Basic | — |
| **Pro** | ₹499/mo · $6 · 3.9 ALGO | Unlimited | Full donor analytics | CSV export |
| **Enterprise** | ₹1,999/mo · $24 · 15.7 ALGO | Unlimited | Full + API access | CSV + API |

- **Individual donors always pay zero platform fees**
- Only Algorand network fee applies (~0.001 ALGO per transaction, a fraction of a rupee)
- Revenue comes entirely from company account subscriptions

---

## 👥 Authors

<br/>

<div align="center">

| | | |
|:---:|:---:|:---:|
| <img src="https://github.com/identicons/kaustubh.png" width="80" style="border-radius:50%"/> | <img src="https://github.com/identicons/anshul.png" width="80" style="border-radius:50%"/> | <img src="https://github.com/identicons/goldy.png" width="80" style="border-radius:50%"/> |
| **Kaustubh Bhardwaj** | **Anshul Soni** | **Goldy Choudhary** |
| Full-Stack & Blockchain | Frontend & Web3 Integration | Backend & Database |
| Next.js · Algorand · Prisma | React · Pera Wallet · UI/UX | PostgreSQL · API · Auth |
| [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/kaustubh010) | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/Sonijianshul256) | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/Goldy0012) |

</div>

<br/>

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

<div align="center">

**Built with conviction. Deployed with proof. Trusted by code.**

*CampusFund — Because trust should never depend on a promise.*

<br/>

![Made with Next.js](https://img.shields.io/badge/Made_with-Next.js-000000?style=flat&logo=nextdotjs)
![Powered by Algorand](https://img.shields.io/badge/Powered_by-Algorand-000000?style=flat&logo=algorand)
![Built at a Hackathon](https://img.shields.io/badge/Built_at-a_Hackathon-6EE7B7?style=flat)

</div>
