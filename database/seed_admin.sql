-- Script to Seed Initial Organization and Admin User
-- Run this in the Supabase SQL Editor

DO $$
DECLARE
    -- The Auth User UUID provided by the user
    target_user_uuid uuid := '959ca072-26da-482f-a33d-9e684140a0f1'; 
    new_org_id uuid;
BEGIN
    -- 1. Create a new Organization
    INSERT INTO organization (nombre, config_global)
    VALUES ('Universidad Demo', '{"plan": "enterprise"}'::jsonb)
    RETURNING org_id INTO new_org_id;

    -- 2. Link the Auth User to the Organization with 'admin' role
    INSERT INTO app_user (user_id, org_id, rol)
    VALUES (target_user_uuid, new_org_id, 'admin');

    RAISE NOTICE 'SUCCESS: Organization created with ID: %', new_org_id;
    RAISE NOTICE 'SUCCESS: User % linked as ADMIN.', target_user_uuid;
END $$;
