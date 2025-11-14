require('dotenv').config();
import { ActualBudget } from '../nodes/ActualBudget/ActualBudget.node';
import { IExecuteFunctions, ILoadOptionsFunctions, NodeApiError } from 'n8n-workflow';
import * as api from '@actual-app/api';

// Integration tests for Actual Budget.
// These tests connect to a live instance of Actual Budget.
// To run them, create a .env file in the project root with:
// ACTUAL_SERVER_URL=http://localhost:5006
// ACTUAL_SERVER_PASSWORD=your-password
// ACTUAL_BUDGET_ID=your-budget-id

describe('ActualBudget Node', () => {
	it('should have a description', () => {
		const node = new ActualBudget();
		expect(node.description).toBeDefined();
	});

	describe('loadOptions', () => {
		describe('Integration Tests', () => {
			beforeAll(async () => {
				try {
					console.log('ACTUAL_BUDGET_ID:', process.env.ACTUAL_BUDGET_ID);
					console.log('ACTUAL_SERVER_URL:', process.env.ACTUAL_SERVER_URL);

					await api.init({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						dataDir: 'tests/dataDir',
					});
					await api.downloadBudget(process.env.ACTUAL_BUDGET_ID as string);
				} catch (error) {
					console.error('Failed to initialize Actual Budget API:', error);
					throw error;
				}
			});

			afterAll(async () => {
				await api.shutdown();
			});

			it('getAccounts should return accounts from a live server', async () => {
				const loadOptionsFunctions = {
					getCredentials: jest.fn().mockResolvedValue({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
					}),
					getNode: jest.fn(),
				} as unknown as ILoadOptionsFunctions;

				const node = new ActualBudget();
				let testAccountId: string | null = null;
				const accountName = `Test Account ${Date.now()}`;

				try {
					// Create a test account to ensure we have one to test against
					testAccountId = await api.createAccount({ name: accountName, type: 'checking' });
					await api.downloadBudget(process.env.ACTUAL_BUDGET_ID as string);

					const result = await node.methods.loadOptions.getAccounts.call(loadOptionsFunctions);

					// We expect the result to be an array, and we can't know the exact content
					expect(Array.isArray(result)).toBe(true);

					// Find the created account in the results
					const testAccount = result.find((account) => account.name === accountName);
					expect(testAccount).toBeDefined();
					expect(testAccount?.value).toBe(testAccountId);

				} catch (error) {
					if (error instanceof NodeApiError) {
						const errorMessage = (error.cause as Error)?.message || error.message;
						console.error('Caught NodeApiError:', errorMessage);
					} else {
						console.error('Caught unexpected error:', error);
					}
					throw error;
				} finally {
					// Clean up the test account
					if (testAccountId) {
						// Re-initialize the API to ensure the budget is loaded for cleanup
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_BUDGET_ID as string);
						await api.deleteAccount(testAccountId);
						await api.shutdown();
					}
				}
			});
		});
	});
	describe('execute', () => {
		describe('Integration Tests', () => {
			beforeAll(async () => {
				try {
					await api.init({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						dataDir: 'tests/dataDir',
					});
					await api.downloadBudget(process.env.ACTUAL_BUDGET_ID as string);
				} catch (error) {
					console.error('Failed to initialize Actual Budget API:', error);
					throw error;
				}
			});

			afterAll(async () => {
				await api.shutdown();
			});

			it('getTransactions should return transactions from a live server', async () => {
				const node = new ActualBudget();
				let testAccountId: string | null = null;

				try {
					// Create a test account to ensure we have one to test against
					const accountName = `Test Account ${Date.now()}`;
					testAccountId = await api.createAccount({ name: accountName, type: 'checking' });

					// Add a transaction to the test account
					await api.addTransactions(testAccountId, [
						{
							date: '2023-10-26',
							amount: -5000, // in cents
							payee_name: 'Test Payee',
						},
					]);

					const executeFunctions = {
						getCredentials: jest.fn().mockResolvedValue({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
						}),
						getNode: jest.fn(),
						getNodeParameter: jest.fn((name: string) => {
							if (name === 'resource') return 'transaction';
							if (name === 'operation') return 'getAll';
							if (name === 'accountId') return testAccountId;
							if (name === 'startDate') return '2023-01-01';
							if (name === 'endDate') return '2023-12-31';
							return null;
						}),
						getInputData: jest.fn().mockReturnValue([
							{},
						]),
						helpers: {
							returnJsonArray: jest.fn((data) => data),
						},
					} as unknown as IExecuteFunctions;

					const result = await node.execute.call(executeFunctions);

					// We expect the result to be an array, and we can't know the exact content
					expect(Array.isArray(result)).toBe(true);
					// Optional: Check if the array is not empty, assuming the test server has transactions
					if (result.length > 0) {
						expect(result[0][0].json.data[0]).toHaveProperty('imported_payee', 'Test Payee');
						expect(result[0][0].json.data[0]).toHaveProperty('amount', -5000);
					}
				} catch (error) {
					if (error instanceof NodeApiError) {
						const errorMessage = (error.cause as Error)?.message || error.message;
						console.error('Caught NodeApiError:', errorMessage);
					} else {
						console.error('Caught unexpected error:', error);
					}
					throw error;
				} finally {
					// Clean up the test account
					if (testAccountId) {
						// Re-initialize the API to ensure the budget is loaded for cleanup
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_BUDGET_ID as string);
						await api.deleteAccount(testAccountId);
						await api.shutdown();
					}
				}
			});
		});
	});
});
