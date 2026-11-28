-- Caller must COMMIT on success or ROLLBACK on failure. READ COMMITTED.
CREATE OR REPLACE PROCEDURE contract_subscription (
    p_account_id IN accounts.account_id%TYPE,
    p_plan_id IN plans.plan_id%TYPE,
    p_payment_approved IN NUMBER,
    p_reference IN payments.reference%TYPE,
    p_subscription_id OUT subscriptions.subscription_id%TYPE
) AUTHID DEFINER AS
    v_account accounts.account_id%TYPE;
    v_price plans.price%TYPE;
    v_max plans.max_profiles%TYPE;
    v_count NUMBER;
    v_now TIMESTAMP;
BEGIN
    SAVEPOINT contract_sp;
    p_subscription_id := NULL;
    SELECT account_id INTO v_account FROM accounts
    WHERE account_id = p_account_id FOR UPDATE;
    v_now := CAST(SYS_EXTRACT_UTC(SYSTIMESTAMP) AS TIMESTAMP);
    SELECT price, max_profiles INTO v_price, v_max FROM plans
    WHERE plan_id = p_plan_id;
    SELECT COUNT(*) INTO v_count FROM subscriptions
    WHERE account_id = p_account_id AND starts_at < v_now + INTERVAL '30' DAY
      AND v_now < ends_at;
    IF v_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'Existe una suscripcion incompatible con el periodo');
    END IF;
    SELECT COUNT(*) INTO v_count FROM profiles
    WHERE account_id = p_account_id AND is_active = '1';
    IF v_count > v_max THEN
        RAISE_APPLICATION_ERROR(-20003, 'Desactive los perfiles excedentes');
    END IF;
    IF p_payment_approved IS NULL OR p_payment_approved <> 1 THEN
        RAISE_APPLICATION_ERROR(-20004, 'Pago rechazado');
    END IF;
    INSERT INTO subscriptions (account_id, plan_id, starts_at, ends_at)
    VALUES (p_account_id, p_plan_id, v_now, v_now + INTERVAL '30' DAY)
    RETURNING subscription_id INTO p_subscription_id;
    -- A duplicate or NULL payment reference fails here, after subscription insertion.
    INSERT INTO payments (subscription_id, paid_at, amount, reference)
    VALUES (p_subscription_id, v_now, v_price, p_reference);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK TO contract_sp;
        p_subscription_id := NULL;
        RAISE;
END;
/
SHOW ERRORS PROCEDURE contract_subscription
