-- FORCE ADMIN SCRIPT
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    target_user_uuid uuid := '959ca072-26da-482f-a33d-9e684140a0f1';
    target_org_id uuid;
BEGIN
    -- 1. Get an existing Organization ID or Create one if none exists
    SELECT org_id INTO target_org_id FROM organization LIMIT 1;
    
    IF target_org_id IS NULL THEN
        INSERT INTO organization (nombre, config_global)
        VALUES ('Universidad Demo', '{"plan": "enterprise"}'::jsonb)
        RETURNING org_id INTO target_org_id;
        RAISE NOTICE 'Created new Organization: %', target_org_id;
    ELSE
        RAISE NOTICE 'Using existing Organization: %', target_org_id;
    END IF;

    -- 2. Upsert the User as Admin (Insert or Update if exists)
    INSERT INTO app_user (user_id, org_id, rol)
    VALUES (target_user_uuid, target_org_id, 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        rol = 'admin', 
        org_id = target_org_id; -- Ensure they are in the valid org

    RAISE NOTICE 'SUCCESS: User % is now confirmed as ADMIN.', target_user_uuid;
END $$;

-- Validation Query (Select this part and run it to see the result)
SELECT * FROM app_user WHERE user_id = '959ca072-26da-482f-a33d-9e684140a0f1';
