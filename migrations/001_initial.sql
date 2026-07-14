-- RTV Survey Management System - Initial Schema
-- Run this in Cloudflare D1 dashboard or via wrangler

-- ============================================================
-- DIMENSION TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  store_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_customer_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL CHECK(category IN ('WM','RF','AC','TV')),
  sub_category TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ============================================================
-- TRANSACTION TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS survey_headers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  respondent_name TEXT NOT NULL,
  respondent_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted')),
  submitted_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_survey_headers_customer_id ON survey_headers(customer_id);
CREATE INDEX IF NOT EXISTS idx_survey_headers_status ON survey_headers(status);

CREATE TABLE IF NOT EXISTS survey_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  header_id INTEGER NOT NULL REFERENCES survey_headers(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('WM','RF','AC','TV')),
  model TEXT NOT NULL,
  serial_number TEXT NOT NULL DEFAULT '',
  damage_issue TEXT NOT NULL DEFAULT '',
  product_photos TEXT NOT NULL DEFAULT '[]',
  box_package TEXT NOT NULL DEFAULT 'ไม่มีกล่อง' CHECK(box_package IN ('มีกล่อง','ไม่มีกล่อง')),
  box_photos TEXT NOT NULL DEFAULT '[]',
  service_doc TEXT NOT NULL DEFAULT 'ไม่มี' CHECK(service_doc IN ('มี','ไม่มี')),
  service_doc_photos TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_survey_details_header_id ON survey_details(header_id);
