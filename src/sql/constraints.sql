
-- CineConecta
-- Restricciones adicionales del modelo relacional

-- PLANS

ALTER TABLE plans
    ADD CONSTRAINT ck_plans_price
        CHECK (price >= 0);

ALTER TABLE plans
    ADD CONSTRAINT ck_plans_max_profiles
        CHECK (max_profiles > 0);


-- PROFILES

ALTER TABLE profiles
    ADD CONSTRAINT ck_profiles_age_rating
        CHECK (max_age_rating BETWEEN 0 AND 18);

ALTER TABLE profiles
    ADD CONSTRAINT ck_profiles_active
        CHECK (is_active IN ('1', '0'));


-- SUBSCRIPTIONS

ALTER TABLE subscriptions
    ADD CONSTRAINT ck_subscriptions_dates
        CHECK (ends_at > starts_at);

ALTER TABLE subscriptions
    ADD CONSTRAINT ck_subscriptions_duration
        CHECK (ends_at = starts_at + INTERVAL '30' DAY);


-- PAYMENTS

ALTER TABLE payments
    ADD CONSTRAINT ck_payments_amount
        CHECK (amount >= 0);
