CREATE OR REPLACE TRIGGER trg_compound_subscriptions
FOR INSERT OR UPDATE ON subscriptions
COMPOUND TRIGGER

    TYPE s_ids         IS TABLE OF subscriptions.subscription_id%TYPE;
    TYPE s_account_ids IS TABLE OF subscriptions.account_id%TYPE;
    TYPE s_starts_at   IS TABLE OF subscriptions.starts_at%TYPE;
    TYPE s_ends_at     IS TABLE OF subscriptions.ends_at%TYPE;

    v_ids       s_ids         := s_ids();
    v_accounts  s_account_ids := s_account_ids();
    v_starts    s_starts_at   := s_starts_at();
    v_ends      s_ends_at     := s_ends_at();

    AFTER EACH ROW IS
    BEGIN
        v_ids.EXTEND;
        v_accounts.EXTEND;
        v_starts.EXTEND;
        v_ends.EXTEND;

        v_ids(v_ids.LAST)           := :NEW.subscription_id;
        v_accounts(v_accounts.LAST) := :NEW.account_id;
        v_starts(v_starts.LAST)     := :NEW.starts_at;
        v_ends(v_ends.LAST)         := :NEW.ends_at;
    END AFTER EACH ROW;

    AFTER STATEMENT IS
        v_overlap_count INTEGER;
    BEGIN
        FOR i IN 1..v_ids.COUNT LOOP
            SELECT COUNT(*)
            INTO v_overlap_count
            FROM subscriptions s
            WHERE s.account_id       = v_accounts(i)
              AND s.subscription_id <> v_ids(i)
              AND v_starts(i)        < s.ends_at
              AND s.starts_at        < v_ends(i);

            IF v_overlap_count > 0 THEN
                RAISE_APPLICATION_ERROR(
                    -20001,
                    'La cuenta ' || v_accounts(i) ||
                    ' ya tiene una suscripcion con fechas solapadas (subscription_id=' ||
                    v_ids(i) || ').'
                );
            END IF;
        END LOOP;
    END AFTER STATEMENT;

END trg_compound_subscriptions;
/