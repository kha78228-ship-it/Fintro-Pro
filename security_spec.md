# Security Specification for FinTrack Pro

## 1. Data Invariants
- A transaction must belong to a user.
- A user cannot read or write another user's transactions or budgets.
- Transaction amounts must be non-negative (validation logic will enforce this).
- Dates must be ISO strings and not in the future (optional but good).
- Categories can be system-wide (read-only) or user-specific.

## 2. The "Dirty Dozen" Payloads (Deny Cases)
1. **Identity Theft**: User A tries to write a transaction to User B's path.
2. **Identity Spoofing**: User A writes to their own path but sets `userId` field to User B's ID.
3. **Ghost Field Injection**: Adding `isAdmin: true` to a user profile.
4. **Negative Expense**: Setting a transaction amount to -100 to increase balance.
5. **Path Poisoning**: Using a 2KB string as a transaction ID.
6. **Orphaned Budget**: Creating a budget for a non-existent category.
7. **Cross-User Leak**: User A listing `/users/UserB/transactions`.
8. **PII Leak**: Non-admin reading `/users` root.
9. **State Shortcut**: (N/A for this app, but if we had approvals, skipping approval).
10. **Huge Body**: Sending a Transaction description with 1MB of text.
11. **Future Transaction**: Setting transaction date to 2050 (if we enforce temporal integrity).
12. **Unauthorized Metadata**: User trying to change their own role in a profile.

## 3. Test Runner (Draft)
I will implement `firestore.rules` that address these.
