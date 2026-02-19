-- Setup first superadmin user
-- Run this after creating your first user via Supabase Auth

-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create your first user (or note the UUID of existing user)
-- 3. Copy the user UUID
-- 4. Replace 'YOUR_USER_UUID_HERE' below with your actual UUID
-- 5. Run this script

-- Step 1: Create organization
INSERT INTO organization (org_id, nombre, config_global)
VALUES (
    gen_random_uuid(),
    'Mi Organización',
    '{
        "limite_tokens_mensual": 1000000,
        "limite_mensajes_mensual": 10000,
        "presupuesto_mensual_usd": 100,
        "dominios_autorizados": ["localhost", "127.0.0.1"]
    }'::jsonb
)
ON CONFLICT DO NOTHING
RETURNING org_id;

-- Copy the org_id from the result above and use it below

-- Step 2: Create app_user record
-- Replace BOTH UUIDs below:
-- - First UUID: your auth.users id (from Supabase Auth dashboard)
-- - Second UUID: the org_id from step 1

INSERT INTO app_user (user_id, org_id, rol)
VALUES (
    '959ca072-26da-482f-a33d-9e684140a0f1', -- YOUR USER UUID FROM AUTH.USERS
    (SELECT org_id FROM organization LIMIT 1), -- Uses first org
    'superadmin'
)
ON CONFLICT (user_id) DO UPDATE
SET rol = 'superadmin',
    org_id = (SELECT org_id FROM organization LIMIT 1);

-- Verification: Check if user was created
SELECT
    u.user_id,
    u.rol,
    u.org_id,
    o.nombre as organization_name
FROM app_user u
JOIN organization o ON u.org_id = o.org_id
WHERE u.user_id = '959ca072-26da-482f-a33d-9e684140a0f1';
