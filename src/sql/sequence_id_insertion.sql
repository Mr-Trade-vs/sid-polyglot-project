CREATE SEQUENCE seq_payments START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_payments_bi
BEFORE INSERT ON payments
FOR EACH ROW
BEGIN
    IF :NEW.payment_id IS NULL THEN
        :NEW.payment_id := seq_payments.NEXTVAL;
    END IF;
END;
/

CREATE SEQUENCE seq_subscriptions START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_subscriptions_bi
BEFORE INSERT ON subscriptions
FOR EACH ROW
BEGIN
    IF :NEW.subscription_id IS NULL THEN
        :NEW.subscription_id := seq_subscriptions.NEXTVAL;
    END IF;
END;
/

CREATE SEQUENCE seq_plans START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_plans_bi
BEFORE INSERT ON plans
FOR EACH ROW
BEGIN
    IF :NEW.plan_id IS NULL THEN
        :NEW.plan_id := seq_plans.NEXTVAL;
    END IF;
END;
/

CREATE SEQUENCE seq_accounts START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_accounts_bi
BEFORE INSERT ON accounts
FOR EACH ROW
BEGIN
    IF :NEW.account_id IS NULL THEN
        :NEW.account_id := seq_accounts.NEXTVAL;
    END IF;
END;
/

CREATE SEQUENCE seq_profiles START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_profiles_bi
BEFORE INSERT ON profiles
FOR EACH ROW
BEGIN
    IF :NEW.profile_id IS NULL THEN
        :NEW.profile_id := seq_profiles.NEXTVAL;
    END IF;
END;
/