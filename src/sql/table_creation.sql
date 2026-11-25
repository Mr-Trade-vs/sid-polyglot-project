/*
Payments Table
Have a relation one to one with susbcription table
*/
CREATE TABLE payments (
    payment_id INT PRIMARY KEY,
    subscription_id INT UNIQUE NOT NULL,
    paid_at TIMESTAMP NOT NULL,
    amount NUMBER(12,2) NOT NULL,
    reference VARCHAR2(100) UNIQUE NOT NULL
);

/* 
Subscriptions Table
Relation one to one with payments tables
Relation may to one with accounts
*/
CREATE TABLE subscriptions (
    subscription_id INT PRIMARY KEY,
    account_id INT NOT NULL,
    plan_id INT NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL
);

/*
Plains Table
Relation one to many with subscriptions
*/
CREATE TABLE plans (
    plan_id INT PRIMARY KEY,
    name VARCHAR2(60) UNIQUE NOT NULL,
    price NUMBER(12,2) NOT NULL,
    max_Profiles INT NOT NULL
);

/*
Accounts table
Relation one to many with subscriptions
Relation one to many with profiles
*/
CREATE TABLE accounts (
    account_id INT PRIMARY KEY,
    full_name VARCHAR2(150) NOT NULL,
    email VARCHAR2(254) NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

/*
Profiles Table
Relation many to one with accounts
*/
CREATE TABLE profiles (
    profile_id INT PRIMARY KEY,
    account_id INT NOT NULL,
    name VARCHAR2(60) NOT NULL,
    max_age_rating INT NOT NULL,
    is_active CHAR(1) NOT NULL
);

/*
Add Foreing Keys
*/

ALTER TABLE payments
ADD CONSTRAINT FK_payments_subscription 
FOREIGN KEY (subscription_id)
REFERENCES subscriptions(subscription_id);

ALTER TABLE subscriptions
ADD CONSTRAINT FK_subs_account FOREIGN KEY (account_id)
REFERENCES accounts(account_id);

ALTER TABLE subscriptions
ADD CONSTRAINT FK_subs_plan FOREIGN KEY (plan_id)
REFERENCES plans(plan_id);

ALTER TABLE profiles
ADD CONSTRAINT FK_profiles_account FOREIGN KEY (account_id)
REFERENCES accounts(account_id);

/*
Case-insensitive unique constraint
*/
CREATE UNIQUE INDEX UX_profiles_name_ci ON profiles(account_id, LOWER(name));
CREATE UNIQUE INDEX UX_accounts_email_ci ON accounts(LOWER(email));
