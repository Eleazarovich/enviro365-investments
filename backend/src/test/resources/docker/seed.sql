-- Loaded only by the Compose test overlay, after Hibernate creates the schema.
-- The JVM runs in UTC. Relative birthdays keep exact ages stable on every run.
DELETE FROM withdrawal_notice;
DELETE FROM investment_product;
DELETE FROM portfolio;
DELETE FROM investor;
INSERT INTO investor (id, name, date_of_birth, investor_since) VALUES
 (1, 'Docker Investor', DATEADD('YEAR', -66, CURRENT_DATE), DATE '2026-04-01'),
 (64, 'Investor aged 64', DATEADD('YEAR', -64, CURRENT_DATE), DATE '2026-04-01'),
 (65, 'Investor aged 65', DATEADD('YEAR', -65, CURRENT_DATE), DATE '2026-04-01'),
 (66, 'Investor aged 66', DATEADD('YEAR', -66, CURRENT_DATE), DATE '2026-04-01'),
 (2, 'Other Investor', DATEADD('YEAR', -66, CURRENT_DATE), DATE '2026-04-01');
INSERT INTO portfolio (id, investor_id) VALUES (1, 1), (64, 64), (65, 65), (66, 66), (2, 2);
INSERT INTO investment_product (id, portfolio_id, name, type, balance) VALUES
 (1, 1, 'Cash Investment', 'GENERAL', 100000.00),
 (2, 1, 'Retirement Investment', 'RETIREMENT', 60000.00),
 (3, 1, 'Cash, "Réserve"' || CHAR(10) || 'Fund', 'GENERAL', 1000.00),
 (4, 1, 'Rounded cap', 'GENERAL', 111.12),
 (5, 1, 'Below minimum cap', 'GENERAL', 111.11),
 (6, 1, 'Empty investment', 'GENERAL', 0.00),
 (7, 1, 'Concurrent investment', 'GENERAL', 1000.00),
 (8, 1, 'Fractional cap', 'GENERAL', 1000.01),
 (90, 1, 'Database failure fixture', 'GENERAL', 1000.00),
 (64, 64, 'Retirement age 64', 'RETIREMENT', 1000.00),
 (65, 65, 'Retirement age 65', 'RETIREMENT', 1000.00),
 (66, 66, 'Retirement age 66', 'RETIREMENT', 1000.00),
 (20, 2, 'Other investor cash', 'GENERAL', 2000.00);
INSERT INTO withdrawal_notice (id, product_id, amount, status, submitted_at, active) VALUES
 (1001, 1, 20000.00, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-10-21 09:12:00Z', TRUE),
 (1002, 1, 4500.00, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-09-30 23:59:59.999999Z', FALSE),
 (1003, 2, 7500.50, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-09-01 00:00:00Z', FALSE),
 (1004, 1, 1850.75, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-08-31 23:59:59.999999Z', FALSE),
 (1005, 2, 3200.00, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-10-01 00:00:00Z', FALSE),
 (1006, 1, 100.25, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-09-15 12:00:00Z', FALSE),
 (1007, 2, 200.50, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-09-15 12:00:00Z', FALSE),
 (2001, 20, 300.00, 'SUBMITTED', TIMESTAMP WITH TIME ZONE '2026-09-15 12:00:00Z', TRUE);
ALTER TABLE withdrawal_notice ALTER COLUMN id RESTART WITH 3000;
-- Deliberately fail real inserts for ONE test product. No application test hooks,
-- new statuses, reset endpoints, or production schema changes are needed.
ALTER TABLE withdrawal_notice ADD CONSTRAINT IF NOT EXISTS integration_simulated_failure CHECK (product_id <> 90);
