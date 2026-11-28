-- Shared account lock serializes profile changes and subscription purchases.
CREATE OR REPLACE PROCEDURE create_profile (
    p_account_id IN accounts.account_id%TYPE,
    p_name IN profiles.name%TYPE,
    p_max_age IN profiles.max_age_rating%TYPE,
    p_profile_id OUT profiles.profile_id%TYPE
) AUTHID DEFINER AS
    v_account accounts.account_id%TYPE;
    v_max plans.max_profiles%TYPE;
    v_count NUMBER;
    v_now TIMESTAMP;
BEGIN
    SAVEPOINT profile_sp;
    p_profile_id := NULL;
    SELECT account_id INTO v_account FROM accounts
    WHERE account_id = p_account_id FOR UPDATE;
    v_now := CAST(SYS_EXTRACT_UTC(SYSTIMESTAMP) AS TIMESTAMP);
    SELECT MAX(pl.max_profiles) INTO v_max FROM subscriptions s
    JOIN plans pl ON pl.plan_id = s.plan_id
    WHERE s.account_id = p_account_id AND s.starts_at <= v_now AND v_now < s.ends_at;
    IF v_max IS NULL THEN RAISE_APPLICATION_ERROR(-20005, 'Sin suscripcion vigente'); END IF;
    SELECT COUNT(*) INTO v_count FROM profiles WHERE account_id = p_account_id AND is_active = '1';
    IF v_count >= v_max THEN RAISE_APPLICATION_ERROR(-20006, 'Limite de perfiles alcanzado'); END IF;
    INSERT INTO profiles (account_id, name, max_age_rating, is_active)
    VALUES (p_account_id, p_name, p_max_age, '1') RETURNING profile_id INTO p_profile_id;
EXCEPTION WHEN OTHERS THEN
    ROLLBACK TO profile_sp;
    p_profile_id := NULL;
    RAISE;
END;
/
SHOW ERRORS PROCEDURE create_profile

CREATE OR REPLACE PROCEDURE set_profile_active (
    p_account_id IN accounts.account_id%TYPE,
    p_profile_id IN profiles.profile_id%TYPE,
    p_active IN profiles.is_active%TYPE
) AUTHID DEFINER AS
    v_account accounts.account_id%TYPE;
    v_old profiles.is_active%TYPE;
    v_max plans.max_profiles%TYPE;
    v_count NUMBER;
    v_now TIMESTAMP;
BEGIN
    SAVEPOINT active_sp;
    SELECT account_id INTO v_account FROM accounts WHERE account_id = p_account_id FOR UPDATE;
    SELECT is_active INTO v_old FROM profiles WHERE profile_id = p_profile_id AND account_id = p_account_id;
    IF p_active IS NULL OR p_active NOT IN ('0','1') THEN
        RAISE_APPLICATION_ERROR(-20007, 'Estado invalido');
    END IF;
    IF p_active = '1' AND v_old = '0' THEN
        v_now := CAST(SYS_EXTRACT_UTC(SYSTIMESTAMP) AS TIMESTAMP);
        SELECT MAX(pl.max_profiles) INTO v_max FROM subscriptions s JOIN plans pl ON pl.plan_id = s.plan_id
        WHERE s.account_id = p_account_id AND s.starts_at <= v_now AND v_now < s.ends_at;
        IF v_max IS NULL THEN RAISE_APPLICATION_ERROR(-20005, 'Sin suscripcion vigente'); END IF;
        SELECT COUNT(*) INTO v_count FROM profiles WHERE account_id = p_account_id AND is_active = '1';
        IF v_count >= v_max THEN RAISE_APPLICATION_ERROR(-20006, 'Limite de perfiles alcanzado'); END IF;
    END IF;
    UPDATE profiles SET is_active = p_active WHERE profile_id = p_profile_id AND account_id = p_account_id;
EXCEPTION WHEN OTHERS THEN ROLLBACK TO active_sp; RAISE;
END;
/
SHOW ERRORS PROCEDURE set_profile_active
