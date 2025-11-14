# n8n-nodes-actualbudget

This project is a fork of [TheFehr/n8n-nodes-actual](https://github.com/TheFehr/n8n-nodes-actual). 
The project goals are to develop and add complete features for the Actual Budget API, including comprehensive operations for accounts, budgets, categories, payees, rules, schedules, and transactions, as well as utility functions for synchronization and data management.

This is a n8n community node for Actual Budget. It lets you use Actual in your n8n workflows.

[Actual Budget](https://actualbudget.org/) is a local-first personal finance tool. It is 100% free and open-source, written in NodeJS, it has a synchronization element so that all your changes can move between devices without any heavy lifting.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)
[Compatibility](#compatibility)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Usage

To use this node in your n8n workflows, you first need to configure your Actual Budget API credentials. This includes providing the **Server URL**, **Password**, and **Sync ID** for the budget you wish to access.

Once your credentials are set up, you can use the Actual Budget node in your workflows. The node is organized by **Resource**, such as `Account`, `Transaction`, or `Category`, and each resource has a set of **Operations** you can perform, like `Get Many`, `Create`, or `Update`.

To get started, drag the **Actual Budget** node onto your canvas, select your credentials, and then choose the desired **Resource** and **Operation**. Depending on the operation, you may need to provide additional parameters, such as an account ID for fetching transactions or the details for creating a new category.

For more detailed information on building workflows with n8n, refer to the [n8n documentation](https://docs.n8n.io/).

## Operations
This node provides comprehensive operations across various Actual Budget resources:

### Account Operations
*   **Close**: Close an existing account.
*   **Create**: Create a new account.
*   **Delete**: Delete an account.
*   **Get Balance**: Retrieve the balance of a specific account.
*   **Get Many**: Retrieve multiple accounts.
*   **Reopen**: Reopen a closed account.
*   **Update**: Update an existing account.

### Budget Operations
*   **Batch Updates**: Perform multiple budget updates in a single batch.
*   **Download**: Download budget data.
*   **Get Month**: Retrieve budget data for a specific month.
*   **Get Months**: Retrieve budget data for multiple months.
*   **Hold For Next Month**: Set a category's budget to hold for the next month.
*   **Load**: Load budget data.
*   **Reset Hold**: Reset a category's budget hold.
*   **Set Amount**: Set the budgeted amount for a category in a specific month.
*   **Set Carryover**: Configure carryover for a category in a specific month.

### Category Operations
*   **Create**: Create a new category.
*   **Delete**: Delete a category.
*   **Get Many**: Retrieve multiple categories.
*   **Update**: Update an existing category.

### Category Group Operations
*   **Create**: Create a new category group.
*   **Delete**: Delete a category group.
*   **Get Many**: Retrieve multiple category groups.
*   **Update**: Update an existing category group.

### Payee Operations
*   **Create**: Create a new payee.
*   **Delete**: Delete a payee.
*   **Get Many**: Retrieve multiple payees.
*   **Get Rules**: Retrieve rules associated with a payee.
*   **Merge**: Merge multiple payees into one.
*   **Update**: Update an existing payee.

### Rule Operations
*   **Create**: Create a new rule.
*   **Delete**: Delete a rule.
*   **Get Many**: Retrieve multiple rules.
*   **Update**: Update an existing rule.

### Schedule Operations
*   **Create**: Create a new schedule.
*   **Delete**: Delete a schedule.
*   **Get Many**: Retrieve multiple schedules.
*   **Update**: Update an existing schedule.

### Transaction Operations
*   **Add**: Add new transactions.
*   **Delete**: Delete a transaction.
*   **Get Many**: Retrieve multiple transactions.
*   **Import**: Import transactions.
*   **Update**: Update an existing transaction.

### Utility Operations
*   **Get ID By Name**: Retrieve the ID of an entity by its name.
*   **Run Bank Sync**: Run bank synchronization for an account.
*   **Run Query**: Execute a custom query.
*   **Sync**: Synchronize data.

## Credentials

To connect to your Actual Budget instance, you will need to provide the **Server URL**, **Password**, and **Sync ID**.

*   **Server URL**: This is the URL where your Actual Budget instance is hosted (e.g., `http://localhost:5006` or your custom domain).
*   **Password**: This is the password you use to access your Actual Budget instance.
*   **Sync ID**: The Sync ID of the Budget you want to work on. You can find this in the URL of your budget file in Actual Budget.

E2E budgets are currently **not** supported.

## Development

### Prerequisites

*   [Node.js](https://nodejs.org/) (version specified in `package.json`)
*   [npm](https://www.npmjs.com/)

### Installation

1.  Clone the repository.
2.  Install the dependencies:

    ```bash
    npm install
    ```

### Build

To build the node, run the following command:

```bash
npm run build
```

This will compile the TypeScript code to JavaScript and copy the necessary files to the `dist` directory.

### Development Mode

To run the node in development mode with automatic recompilation on file changes, use the following command:

```bash
npm run dev
```

### Linting and Formatting

This project uses ESLint for linting and Prettier for code formatting.

*   **To run the linter:**

    ```bash
    npm run lint
    ```

*   **To automatically fix linting errors:**

    ```bash
    npm run lintfix
    ```

*   **To format the code:**

    ```bash
    npm run format
    ```

### Testing

This project uses Jest for testing. To run the tests, use the following command:

```bash
npm test
```

## Compatibility

This node was developed and tested with version **1.97.1** of n8n and version **25.6.1** of Actual. While it may be compatible with newer versions, functionality is not guaranteed.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Actual Budget Website](https://actualbudget.org/)

## Contributing

We welcome contributions to this project! If you have suggestions for improvements, new features, or bug fixes, please feel free to:

*   **Report bugs**: Open an issue on the GitHub repository.
*   **Suggest features**: Open an issue on the GitHub repository.
*   **Submit pull requests**: Fork the repository, make your changes, and submit a pull request. Please ensure your code adheres to the existing style and conventions.

## License

This project is licensed under the [MIT License](LICENSE.md).
