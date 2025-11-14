## Unimplemented API Features

Based on a review of the `@actual-app/api` documentation and the existing codebase, the following features are not yet implemented in this n8n node:

### Accounts
- `closeAccount(id)`
- `createAccount(account)`
- `deleteAccount(id)`
- `getAccount(id)`
- `reopenAccount(id)`
- `updateAccount(id, fields)`

### Payees
- `createPayee(payee)`
- `deletePayee(id)`
- `getPayee(id)`
- `updatePayee(id, fields)`

### Rules
- `createRule(rule)`
- `deleteRule(id)`
- `getRule(id)`
- `updateRule(id, fields)`

### Schedules
- `createSchedule(schedule)`
- `deleteSchedule(id)`
- `getSchedule(id)`
- `updateSchedule(id, fields)`

### Transactions
- `deleteTransaction(id)`
- `getTransaction(id)`

### Miscellaneous
- `runQuery(query)`
- `sync()`
- `runBankSync()`
- `utils.amountToInteger(amount)`
- `utils.integerToAmount(amount)`

## Implementation Task List

Here is a task list for implementing the missing features:

### Account Operations
- [ ] Implement `closeAccount` operation.
- [ ] Implement `createAccount` operation.
- [ ] Implement `deleteAccount` operation.
- [ ] Implement `getAccount` operation.
- [ ] Implement `reopenAccount` operation.
- [ ] Implement `updateAccount` operation.

### Payee Operations
- [ ] Implement `createPayee` operation.
- [ ] Implement `deletePayee` operation.
- [ ] Implement `getPayee` operation.
- [ ] Implement `updatePayee` operation.

### Rule Operations
- [ ] Implement `createRule` operation.
- [ ] Implement `deleteRule` operation.
- [ ] Implement `getRule` operation.
- [ ] Implement `updateRule` operation.

### Schedule Operations
- [ ] Implement `createSchedule` operation.
- [ ] Implement `deleteSchedule` operation.
- [ ] Implement `getSchedule` operation.
- [ ] Implement `updateSchedule` operation.

### Transaction Operations
- [ ] Implement `deleteTransaction` operation.
- [ ] Implement `getTransaction` operation.

### Utility Operations
- [ ] Implement `runQuery` operation.
- [ ] Implement `sync` operation.
- [ ] Implement `runBankSync` operation.
- [ ] Implement `amountToInteger` utility function.
- [ ] Implement `integerToAmount` utility function.