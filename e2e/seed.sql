-- Only mounted in the disposable E2E container. Reloaded before EVERY test.
DELETE FROM withdrawal_notice;
DELETE FROM investment_product;
DELETE FROM portfolio;
DELETE FROM investor;
INSERT INTO investor (id, name, date_of_birth, investor_since) VALUES
 (1, 'E2E Investor', DATEADD('YEAR', -68, CURRENT_DATE), DATE '2026-04-01');
INSERT INTO portfolio (id, investor_id) VALUES (1, 1);
INSERT INTO investment_product (id, portfolio_id, name, type, balance) VALUES
 (1, 1, 'Cash Investment', 'GENERAL', 100000.00),
 (2, 1, 'Retirement Investment', 'RETIREMENT', 60000.00);
-- Inactive imported history is already reflected in the underlying balances.
INSERT INTO withdrawal_notice (id, product_id, amount, status, submitted_at, active) VALUES
 (1001, 1, 20000.00, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-10-21 09:12:00Z', TRUE),
 (1002, 1, 4500.00, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-09-30 23:59:59.999999Z', FALSE),
 (1003, 2, 7500.50, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-09-01 00:00:00Z', FALSE),
 (1004, 1, 1850.75, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-08-31 23:59:59.999999Z', FALSE),
 (1005, 2, 3200.00, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-10-01 00:00:00Z', FALSE),
 (1006, 1, 100.25, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-09-01 00:00:00Z', FALSE),
 (1007, 1, 200.50, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-09-15 12:00:00Z', FALSE),
 (1008, 2, 850.75, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-09-30 23:59:59.999999Z', FALSE);
ALTER TABLE withdrawal_notice ALTER COLUMN id RESTART WITH 3000;
