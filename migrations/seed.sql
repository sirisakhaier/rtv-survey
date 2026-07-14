-- Seed Data for RTV Survey System
-- Run AFTER 001_initial.sql

-- ============================================================
-- CUSTOMERS / STORES
-- ============================================================
INSERT INTO customers (customer_name, store_id, store_name, province, region) VALUES
('Lotus', 'LT001', 'โลตัส รัชดา', 'กรุงเทพมหานคร', 'กลาง'),
('Lotus', 'LT002', 'โลตัส บางใหญ่', 'นนทบุรี', 'กลาง'),
('Lotus', 'LT003', 'โลตัส เชียงใหม่', 'เชียงใหม่', 'เหนือ'),
('Lotus', 'LT004', 'โลตัส ภูเก็ต', 'ภูเก็ต', 'ใต้'),
('BigC', 'BC001', 'บิ๊กซี ลาดพร้าว', 'กรุงเทพมหานคร', 'กลาง'),
('BigC', 'BC002', 'บิ๊กซี สุขุมวิท', 'กรุงเทพมหานคร', 'กลาง'),
('BigC', 'BC003', 'บิ๊กซี เชียงราย', 'เชียงราย', 'เหนือ'),
('BigC', 'BC004', 'บิ๊กซี หาดใหญ่', 'สงขลา', 'ใต้'),
('Makro', 'MK001', 'แม็คโคร ลาดกระบัง', 'กรุงเทพมหานคร', 'กลาง'),
('Makro', 'MK002', 'แม็คโคร โคราช', 'นครราชสีมา', 'ตะวันออกเฉียงเหนือ'),
('HomePro', 'HP001', 'โฮมโปร รัตนาธิเบศร์', 'นนทบุรี', 'กลาง'),
('HomePro', 'HP002', 'โฮมโปร ศรีราชา', 'ชลบุรี', 'ตะวันออก');

-- ============================================================
-- PRODUCTS
-- ============================================================
-- Washing Machines (WM)
INSERT INTO products (category, sub_category, model) VALUES
('WM', 'Front Load', 'WF-XX1234'),
('WM', 'Front Load', 'WF-XX5678'),
('WM', 'Front Load', 'WF-XX9012'),
('WM', 'Top Load', 'WT-YY1111'),
('WM', 'Top Load', 'WT-YY2222'),
('WM', 'Top Load', 'WT-YY3333'),
-- Refrigerators (RF)
('RF', 'Single Door', 'RF-SD1001'),
('RF', 'Single Door', 'RF-SD1002'),
('RF', '2 Door', 'RF-2D2001'),
('RF', '2 Door', 'RF-2D2002'),
('RF', 'Side by Side', 'RF-SS3001'),
('RF', 'Side by Side', 'RF-SS3002'),
-- Air Conditioners (AC)
('AC', 'Inverter', 'AC-INV001'),
('AC', 'Inverter', 'AC-INV002'),
('AC', 'Inverter', 'AC-INV003'),
('AC', 'Standard', 'AC-STD001'),
('AC', 'Standard', 'AC-STD002'),
-- Televisions (TV)
('TV', 'OLED', 'TV-OL001'),
('TV', 'QLED', 'TV-QL001'),
('TV', 'LED', 'TV-LD001'),
('TV', 'LED', 'TV-LD002'),
('TV', 'LED', 'TV-LD003');
