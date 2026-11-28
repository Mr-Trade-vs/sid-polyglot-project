
CREATE OR REPLACE TRIGGER trg_compound_subscriptions
FOR INSERT OR UPDATE ON subscriptions
                         COMPOUND TRIGGER

                         TYPE t_subscription IS RECORD (
                         subscription_id subscriptions.subscription_id%TYPE,
                         account_id subscriptions.account_id%TYPE,
                         starts_at subscriptions.starts_at%TYPE,
                         ends_at subscriptions.ends_at%TYPE
                         );

TYPE t_subscriptions IS TABLE OF t_subscription
        INDEX BY PLS_INTEGER;

    v_subscriptions t_subscriptions;
    v_index PLS_INTEGER := 0;

    BEFORE EACH ROW IS
        v_account_id accounts.account_id%TYPE;
BEGIN

        -- Bloquear la cuenta hasta COMMIT o ROLLBACK
SELECT account_id
INTO v_account_id
FROM accounts
WHERE account_id = :NEW.account_id
    FOR UPDATE;

END BEFORE EACH ROW;

    AFTER EACH ROW IS
BEGIN

        v_index := v_index + 1;

        v_subscriptions(v_index).subscription_id :=
            :NEW.subscription_id;

        v_subscriptions(v_index).account_id :=
            :NEW.account_id;

        v_subscriptions(v_index).starts_at :=
            :NEW.starts_at;

        v_subscriptions(v_index).ends_at :=
            :NEW.ends_at;

END AFTER EACH ROW;

    AFTER STATEMENT IS
        v_overlap_count INTEGER;
BEGIN

FOR i IN 1..v_index LOOP

SELECT COUNT(*)
INTO v_overlap_count
FROM subscriptions s
WHERE s.account_id =
      v_subscriptions(i).account_id
  AND s.subscription_id <>
      v_subscriptions(i).subscription_id
  AND v_subscriptions(i).starts_at < s.ends_at
  AND s.starts_at < v_subscriptions(i).ends_at;

IF v_overlap_count > 0 THEN

                RAISE_APPLICATION_ERROR(
                    -20001,
                    'La cuenta ya tiene una suscripcion solapada.'
                );

END IF;

END LOOP;

END AFTER STATEMENT;

END trg_compound_subscriptions;
/
