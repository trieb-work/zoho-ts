export type Bankaccount = {
    account_id: string;
    account_name: string;
    account_code: string;
    currency_id: string;
    currency_code: string;
    account_type: string;
    account_number: string;
    uncategorized_transactions: 0;
    total_unprinted_checks: 0;
    is_active: true;
    balance: number;
    bank_balance: number;
    bcy_balance: number;
    bank_name: string;
    routing_number: string;
    is_primary_account: false;
    is_paypal_account: false;
    feeds_last_refresh_date: string;
    is_direct_paypal: false;
    partner_bank_source_formatted: string;
    partner_bank_source: string;
    is_beta_feed: false;
    consent_info: {
        consent_remaining_days: string;
        is_consent_expired: string;
    };
    feed_status: string;
};

export type ListBankaccount = Pick<
    Bankaccount,
    | "account_code"
    | "account_name"
    | "account_type"
    | "balance"
    | "bank_name"
    | "bcy_balance"
    | "currency_code"
    | "feed_status"
    | "is_active"
    | "uncategorized_transactions"
>;
