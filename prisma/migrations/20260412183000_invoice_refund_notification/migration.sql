-- Models existed in schema but tables were never created (invoice_claim_flow only added columns).

CREATE TABLE "InvoiceRefund" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "donorWalletAddress" TEXT NOT NULL,
    "donatedALGO" DOUBLE PRECISION NOT NULL,
    "refundALGO" DOUBLE PRECISION NOT NULL,
    "sharePct" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'surplus',
    "txId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceRefund_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InvoiceRefund_donationId_key" ON "InvoiceRefund"("donationId");

ALTER TABLE "InvoiceRefund" ADD CONSTRAINT "InvoiceRefund_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InvoiceRefund" ADD CONSTRAINT "InvoiceRefund_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InvoiceRefund" ADD CONSTRAINT "InvoiceRefund_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "refundALGO" DOUBLE PRECISION,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
