-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables in reverse order of dependencies if they exist (for clean deployment/re-run)
DROP TABLE IF EXISTS additional_charges CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS buyers CASCADE;
DROP TABLE IF EXISTS sellers CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create Products table
CREATE TABLE products (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hsn" TEXT,
    "sac" TEXT,
    "unit" TEXT,
    "rate" NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    "gstRate" NUMERIC(5, 2) DEFAULT 18.00 NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Sellers table
CREATE TABLE sellers (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT,
    "gstin" TEXT,
    "state" TEXT,
    "stateCode" INTEGER,
    "contact" TEXT,
    "email" TEXT,
    "bankName" TEXT,
    "accNo" TEXT,
    "branch" TEXT,
    "ifsc" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Buyers table
CREATE TABLE buyers (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT,
    "destination" TEXT,
    "contact" TEXT,
    "gstin" TEXT,
    "state" TEXT,
    "stateCode" INTEGER,
    "buyerNumber" TEXT UNIQUE,
    "email" TEXT,
    -- GST Business Details
    "legalName" TEXT,
    "tradeName" TEXT,
    "constitutionOfBusiness" TEXT,
    "taxType" TEXT,
    "gstStatus" TEXT,
    "registrationDate" TEXT,
    "cancelledDate" TEXT,
    "eInvoiceStatus" TEXT,
    "natureOfBusinessActivity" TEXT,
    "lastUpdateDate" TEXT,
    -- GST Jurisdiction
    "stateJurisdiction" TEXT,
    "stateJurisdictionCode" TEXT,
    "centerJurisdiction" TEXT,
    "centerJurisdictionCode" TEXT,
    -- Principal Address (structured)
    "pincode" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Invoices table
CREATE TABLE invoices (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "invoiceNo" TEXT NOT NULL,
    "dcNo" TEXT,
    "date" DATE NOT NULL,
    "dueDate" DATE,
    "poNumber" TEXT,
    "reference" TEXT,
    "placeOfSupply" TEXT,
    "taxType" TEXT NOT NULL,
    "reverseCharge" BOOLEAN DEFAULT FALSE NOT NULL,
    "ewayBillNo" TEXT,
    "vehicleNo" TEXT,
    "transporterName" TEXT,
    "driverName" TEXT,
    "driverMobile" TEXT,
    "transporterId" TEXT,
    "distance" TEXT,
    "modeOfTransport" TEXT,
    "terms" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "taxRate" NUMERIC(5, 2) NOT NULL,
    "mode" TEXT NOT NULL,
    "quotationGstOption" TEXT,
    "subtotal" NUMERIC(15, 2) NOT NULL,
    "cgstAmount" NUMERIC(15, 2) NOT NULL,
    "sgstAmount" NUMERIC(15, 2) NOT NULL,
    "igstAmount" NUMERIC(15, 2) NOT NULL,
    "grandTotal" NUMERIC(15, 2) NOT NULL,
    "paymentStatus" TEXT DEFAULT 'unpaid' NOT NULL,
    "paymentDate" TIMESTAMPTZ,
    "paymentAmount" NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    "paymentNotes" TEXT,
    "dcStatus" TEXT,
    "deliveredDate" TIMESTAMPTZ,
    "receiverName" TEXT,
    "receiverSign" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Seller Snapshot
    "sellerName" TEXT,
    "sellerAddress" TEXT,
    "sellerGstin" TEXT,
    "sellerState" TEXT,
    "sellerStateCode" INTEGER,
    "sellerContact" TEXT,
    "sellerEmail" TEXT,
    "sellerBankName" TEXT,
    "sellerAccNo" TEXT,
    "sellerBranch" TEXT,
    "sellerIfsc" TEXT,
    "sellerLogo" TEXT,

    -- Buyer Snapshot
    "buyerName" TEXT,
    "buyerAddress" TEXT,
    "buyerDestination" TEXT,
    "buyerContact" TEXT,
    "buyerGstin" TEXT,
    "buyerState" TEXT,
    "buyerStateCode" INTEGER,
    "buyerNumber" TEXT,
    "buyerEmail" TEXT,

    -- Billing Address
    "billingName" TEXT,
    "billingAddress" TEXT,
    "billingGstin" TEXT,
    "billingState" TEXT,
    "billingStateCode" INTEGER,

    -- Shipping Address
    "shippingName" TEXT,
    "shippingAddress" TEXT,
    "shippingGstin" TEXT,
    "shippingState" TEXT,
    "shippingStateCode" INTEGER,

    -- Foreign Keys
    "sellerId" UUID NOT NULL REFERENCES sellers("id"),
    "buyerId" UUID NOT NULL REFERENCES buyers("id")
);

-- Create Items table
CREATE TABLE items (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "description" TEXT NOT NULL,
    "hsn" TEXT,
    "sac" TEXT,
    "quantity" NUMERIC(12, 4) NOT NULL,
    "rate" NUMERIC(15, 2) NOT NULL,
    "discount" NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    "unit" TEXT,
    "invoiceId" UUID NOT NULL REFERENCES invoices("id") ON DELETE CASCADE
);

-- Create Additional Charges table
CREATE TABLE additional_charges (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "freight" NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    "insurance" NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    "packing" NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    "other" NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    "discount" NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    "lessAmount" NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    "lessDescription" TEXT,
    "invoiceId" UUID UNIQUE NOT NULL REFERENCES invoices("id") ON DELETE CASCADE
);



-- Indexing for performance and lookup optimizations
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_no ON invoices("invoiceNo");
CREATE INDEX IF NOT EXISTS idx_invoices_dc_no ON invoices("dcNo");
CREATE INDEX IF NOT EXISTS idx_invoices_seller_id ON invoices("sellerId");
CREATE INDEX IF NOT EXISTS idx_invoices_buyer_id ON invoices("buyerId");
CREATE INDEX IF NOT EXISTS idx_invoices_mode ON invoices("mode");
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices("paymentStatus");
CREATE INDEX IF NOT EXISTS idx_items_invoice_id ON items("invoiceId");



-- Trigger function to automatically update the 'updatedAt' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers
CREATE TRIGGER update_sellers_updated_at 
    BEFORE UPDATE ON sellers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyers_updated_at 
    BEFORE UPDATE ON buyers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


