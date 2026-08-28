-- Migration: Add GST detail columns to buyers table
-- Run this on existing databases that already have the buyers table

-- GST Business Details
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "legalName" TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "tradeName" TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "constitutionOfBusiness" TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "taxType" TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "gstStatus" TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "registrationDate" TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "cancelledDate" TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "eInvoiceStatus" TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "natureOfBusinessActivity" TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "lastUpdateDate" TEXT;

-- GST Jurisdiction
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "stateJurisdiction" TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "stateJurisdictionCode" TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "centerJurisdiction" TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "centerJurisdictionCode" TEXT;

-- Principal Address (structured)
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS "pincode" TEXT;
