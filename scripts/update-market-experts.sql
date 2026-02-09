-- Update Market Experts - February 2026
-- Deactivate, update weights, set contrarian flags
BEGIN;

-- 1. Deactivate removed/non-existent experts
UPDATE experts
SET "IsActive" = false, "UpdatedAt" = NOW()
WHERE "Domain" = 'market'
  AND "Handle" IN ('BreakoutPoint', 'carlquintanilla', 'LiveSquawk', 'haborlern', 'zaborsky_jake');

-- 2. Update weights (only those != 5)
UPDATE experts SET "Weight" = 7,  "UpdatedAt" = NOW() WHERE "Handle" = 'AdamMancini4'    AND "Domain" = 'market';
UPDATE experts SET "Weight" = 4,  "UpdatedAt" = NOW() WHERE "Handle" = 'CastilloTrading' AND "Domain" = 'market';
UPDATE experts SET "Weight" = 9,  "UpdatedAt" = NOW() WHERE "Handle" = 'EliteOptions2'   AND "Domain" = 'market';
UPDATE experts SET "Weight" = 6,  "UpdatedAt" = NOW() WHERE "Handle" = 'HenrikZeberg'    AND "Domain" = 'market';
UPDATE experts SET "Weight" = 9,  "UpdatedAt" = NOW() WHERE "Handle" = 'IncomeSharks'    AND "Domain" = 'market';
UPDATE experts SET "Weight" = 7,  "UpdatedAt" = NOW() WHERE "Handle" = 'markminervini'   AND "Domain" = 'market';
UPDATE experts SET "Weight" = 7,  "UpdatedAt" = NOW() WHERE "Handle" = 'PKDayTrading1'   AND "Domain" = 'market';
UPDATE experts SET "Weight" = 7,  "UpdatedAt" = NOW() WHERE "Handle" = 'SuperLuckeee'    AND "Domain" = 'market';
UPDATE experts SET "Weight" = 8,  "UpdatedAt" = NOW() WHERE "Handle" = 'therealmorph835' AND "Domain" = 'market';
UPDATE experts SET "Weight" = 8,  "UpdatedAt" = NOW() WHERE "Handle" = 'The_RockTrading' AND "Domain" = 'market';
UPDATE experts SET "Weight" = 7,  "UpdatedAt" = NOW() WHERE "Handle" = 'TriggerTrades'   AND "Domain" = 'market';
UPDATE experts SET "Weight" = 8,  "UpdatedAt" = NOW() WHERE "Handle" = 'vandy_trades'    AND "Domain" = 'market';
UPDATE experts SET "Weight" = 7,  "UpdatedAt" = NOW() WHERE "Handle" = 'yuriymatso'      AND "Domain" = 'market';

-- 3. Set contrarian flags (true for these 3, reset all others to false)
UPDATE experts
SET "IsContrarian" = false, "UpdatedAt" = NOW()
WHERE "Domain" = 'market' AND "IsContrarian" = true;

UPDATE experts
SET "IsContrarian" = true, "UpdatedAt" = NOW()
WHERE "Domain" = 'market'
  AND "Handle" IN ('Basssem666', 'ShortSeller', 'TriggerTrades');

COMMIT;
