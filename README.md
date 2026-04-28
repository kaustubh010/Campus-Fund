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
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Algorand Escrow Design](#-algorand-escrow-design)
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
                    │  to Creator      │       │  Smart Contract     │
                    │  (Invoice ✓)     │       │  Escrow (per        │
                    └──────────────────┘       │  campaign) locks    │
                            │                  │  funds on-chain     │
                    ┌───────▼──────────┐       └─────────────────────┘
                    │  Excess / Failed │
                    │  funds refunded  │
                    │  pro-rata to     │
                    │  each donor (✗)  │
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

---

## 🛠️ Tech Stack

### Frontend
| Tool | Version | Purpose |
|---|---|---|
| Next.js | 15.x | React framework, App Router, SSR, API routes |
| TypeScript | 5.x | Type safety across the entire codebase |
| Tailwind CSS | 4.x | Utility-first styling |
| Framer Motion | latest | Page transitions, card animations, staggered reveals |
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
| Lucia Auth & Arctic | Authentication — Google + email/password |
| `bcryptjs` | Password hashing |

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
git clone https://github.com/kaustubh010/Campus-Fund.git
cd Campus-Fund

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
```

### Database Setup

```bash
# Run Prisma migrations
npx prisma migrate dev --name init
```

### Run Locally

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
pnpm run build
pnpm start
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root:

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

## 🔗 Algorand Escrow Design

This is the core technical innovation of CampusFund. Each campaign deploys a custom Algorand smart contract that enforces invoice-gated fund release — no trusted intermediary required.

### How the escrow works

```
1. Campaign created
   └─▶ Server deploys a unique Algorand smart contract per campaign
   └─▶ Contract address (escrowAddress) stored on Campaign record in DB
   └─▶ Contract enforces all release logic on-chain — server cannot
       unilaterally sweep funds

2. Donor sends a contribution
   └─▶ Client: Pera Wallet signs a payment txn to escrowAddress
   └─▶ Donor's ALGO moves into the contract escrow (4 second finality)
   └─▶ Server: records Donation row in DB with Algorand txId
       (donor wallet address stored for pro-rata refund calculation)

3. Goal check (on each donation)
   └─▶ Server fetches live balance from Algod: escrowAddress balance
   └─▶ If balance >= campaign.goalALGO → campaign.status = "funded"
   └─▶ Invoice submission unlocks for the creator

4. Creator submits invoice(s)
   └─▶ Creator uploads one or more invoices via /dashboard
   └─▶ Each invoice specifies an amount ≤ remaining escrow balance
   └─▶ Invoices are stored and made visible to donors (transparency layer)
   └─▶ Smart contract validates the claimed amount matches invoice total

5. Creator claims (per invoice)
   └─▶ POST /api/campaigns/[id]/claim
   └─▶ Smart contract verifies: invoice amount ≤ on-chain escrow balance
   └─▶ Contract releases exactly the invoiced ALGO → creator's wallet
   └─▶ Multiple invoices can be submitted and claimed incrementally
   └─▶ Campaign status → "claimed" once fully settled

6. Excess funds / Goal failure
   └─▶ If goal met but invoiced total < escrowed balance:
       remaining funds are refunded to donors pro-rata
       (each donor receives back: excess × (their contribution / total raised))
   └─▶ If deadline passes with balance < goal → status "expired"
       full escrow balance refunded to donors pro-rata
   └─▶ Smart contract enforces both refund paths on-chain
```

## 👥 Authors

<br/>

<div align="center">

| | | |
|:---:|:---:|:---:|
| <img src="https://avatars.githubusercontent.com/u/98745930?v=4" width="80" style="border-radius:50%"/> | <img src="https://avatars.githubusercontent.com/u/229663826?v=4" width="80" style="border-radius:50%"/> | <img src="https://avatars.githubusercontent.com/u/237179240?v=4" width="80" style="border-radius:50%"/> |
| **Kaustubh Bhardwaj** | **Anshul Soni** | **Goldy Choudhary** |
| Full-Stack & Blockchain | Frontend & Web3 Integration | Backend & Database |
| Next.js · Algorand · Prisma | React · Pera Wallet · UI/UX | PostgreSQL · API · Auth |
| [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/kaustubh010) | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/Sonijianshul256) | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/Goldy0012) |

</div>

<br/>

<div align="center">

**Built with conviction. Deployed with proof. Trusted by code.**

*CampusFund — Because trust should never depend on a promise.*

<br/>

![Made with Next.js](https://img.shields.io/badge/Made_with-Next.js-000000?style=flat&logo=nextdotjs)
![Powered by Algorand](https://img.shields.io/badge/Powered_by-Algorand-000000?style=flat&logo=algorand)
![Built at a Hackathon](https://img.shields.io/badge/Built_at-a_Hackathon-6EE7B7?style=flat)

</div>
