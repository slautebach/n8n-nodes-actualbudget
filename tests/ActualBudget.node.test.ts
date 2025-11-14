require('dotenv').config();
import { ActualBudget } from '../nodes/ActualBudget/ActualBudget.node';
import { IExecuteFunctions, ILoadOptionsFunctions, NodeApiError } from 'n8n-workflow';
import * as api from '@actual-app/api';
import * as fs from 'fs';

// Integration tests for Actual Budget.
// These tests connect to a live instance of Actual Budget.
// To run them, create a .env file in the project root with:
// ACTUAL_SERVER_URL=http://localhost:5006
// ACTUAL_SERVER_PASSWORD=your-password
// ACTUAL_SYNC_ID=your-budget-id

describe('ActualBudget Node', () => {
	it('should have a description', () => {
		const node = new ActualBudget();
		expect(node.description).toBeDefined();
	});

	describe('loadOptions', () => {
		describe('Integration Tests', () => {
			beforeEach(async () => {
				try {
					const dataDirPath = 'tests/dataDir';
					if (fs.existsSync(dataDirPath)) {
						fs.rmSync(dataDirPath, { recursive: true, force: true });
					}
					fs.mkdirSync(dataDirPath, { recursive: true });

					await api.init({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						dataDir: dataDirPath,
					});
					await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
				} catch (error) {
					console.error('Failed to initialize Actual Budget API:', error);
					throw error;
				}
			});

			afterEach(async () => {
				await api.shutdown();
			});

			it('getAccounts should return accounts from a live server', async () => {
				const loadOptionsFunctions = {
					getCredentials: jest.fn().mockResolvedValue({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						syncId: process.env.ACTUAL_SYNC_ID,
					}),
					getNode: jest.fn(),
				} as unknown as ILoadOptionsFunctions;

				const node = new ActualBudget();
				let testAccountId: string | null = null;
				const accountName = `Test Account ${Date.now()}`;

				try {
					// Create a test account to ensure we have one to test against
					testAccountId = await api.createAccount({ name: accountName, type: 'checking' });

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
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						await api.deleteAccount(testAccountId);
						await api.shutdown();
					}
				}
			});

			it('getCategories should return categories from a live server', async () => {
				const loadOptionsFunctions = {
					getCredentials: jest.fn().mockResolvedValue({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						syncId: process.env.ACTUAL_SYNC_ID,
					}),
					getNode: jest.fn(),
				} as unknown as ILoadOptionsFunctions;

				const node = new ActualBudget();
				let testGroupId: string | null = null;
				let testCategoryId: string | null = null;
				const categoryName = `Test Category ${Date.now()}`;
				const groupName = `Test Group ${Date.now()}`;

				try {
					// Create a test category group and category to ensure we have one to test against
					testGroupId = await api.createCategoryGroup({ name: groupName });
					testCategoryId = await api.createCategory({ name: categoryName, group_id: testGroupId as string });

					const result = await node.methods.loadOptions.getCategories.call(loadOptionsFunctions);

					expect(Array.isArray(result)).toBe(true);

					const testCategory = result.find((category) => category.name === categoryName);
					expect(testCategory).toBeDefined();
					expect(testCategory?.value).toBe(testCategoryId);

				} catch (error) {
					if (error instanceof NodeApiError) {
						const errorMessage = (error.cause as Error)?.message || error.message;
						console.error('Caught NodeApiError:', errorMessage);
					} else {
						console.error('Caught unexpected error:', error);
					}
					throw error;
				} finally {
					// Clean up
					await api.init({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						dataDir: 'tests/dataDir',
					});
					await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
					if (testCategoryId) {
						await api.deleteCategory(testCategoryId);
					}
					if (testGroupId) {
						await api.deleteCategoryGroup(testGroupId);
					}
					await api.shutdown();
				}
			});

			it('getCategoryGroups should return category groups from a live server', async () => {
				const loadOptionsFunctions = {
					getCredentials: jest.fn().mockResolvedValue({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						syncId: process.env.ACTUAL_SYNC_ID,
					}),
					getNode: jest.fn(),
				} as unknown as ILoadOptionsFunctions;

				const node = new ActualBudget();
				let testGroupId: string | null = null;
				const groupName = `Test Group ${Date.now()}`;

				try {
					testGroupId = await api.createCategoryGroup({ name: groupName });

					const result = await node.methods.loadOptions.getCategoryGroups.call(loadOptionsFunctions);

					expect(Array.isArray(result)).toBe(true);

					const testGroup = result.find((group) => group.name === groupName);
					expect(testGroup).toBeDefined();
					expect(testGroup?.value).toBe(testGroupId);

				} catch (error) {
					if (error instanceof NodeApiError) {
						const errorMessage = (error.cause as Error)?.message || error.message;
						console.error('Caught NodeApiError:', errorMessage);
					} else {
						console.error('Caught unexpected error:', error);
					}
					throw error;
				} finally {
					if (testGroupId) {
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						await api.deleteCategoryGroup(testGroupId);
						await api.shutdown();
					}
				}
			});

			it('getPayees should return payees from a live server', async () => {
				const loadOptionsFunctions = {
					getCredentials: jest.fn().mockResolvedValue({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						syncId: process.env.ACTUAL_SYNC_ID,
					}),
					getNode: jest.fn(),
				} as unknown as ILoadOptionsFunctions;

				const node = new ActualBudget();
				let testPayeeId: string | null = null;
				const payeeName = `Test Payee ${Date.now()}`;

				try {
					testPayeeId = await api.createPayee({ name: payeeName });

					const result = await node.methods.loadOptions.getPayees.call(loadOptionsFunctions);

					expect(Array.isArray(result)).toBe(true);

					const testPayee = result.find((payee) => payee.name === payeeName);
					expect(testPayee).toBeDefined();
					expect(testPayee?.value).toBe(testPayeeId);

				} catch (error) {
					if (error instanceof NodeApiError) {
						const errorMessage = (error.cause as Error)?.message || error.message;
						console.error('Caught NodeApiError:', errorMessage);
					} else {
						console.error('Caught unexpected error:', error);
					}
					throw error;
				} finally {
					if (testPayeeId) {
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						await api.deletePayee(testPayeeId);
						await api.shutdown();
					}
				}
			});

			it('getRules should return rules from a live server', async () => {
				const loadOptionsFunctions = {
					getCredentials: jest.fn().mockResolvedValue({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						syncId: process.env.ACTUAL_SYNC_ID,
					}),
					getNode: jest.fn(),
				} as unknown as ILoadOptionsFunctions;

				const node = new ActualBudget();
				let testRuleId: string | null = null;
				let testPayeeId: string | null = null;
				let testCategoryId: string | null = null;
				let testGroupId: string | null = null;

				try {
					// A rule needs a payee and a category
					const payeeName = `Test Payee for Rule ${Date.now()}`;
					testPayeeId = await api.createPayee({ name: payeeName });

					const groupName = `Test Group for Rule ${Date.now()}`;
					testGroupId = await api.createCategoryGroup({ name: groupName });
					const categoryName = `Test Category for Rule ${Date.now()}`;
					testCategoryId = await api.createCategory({ name: categoryName, group_id: testGroupId as string });

					const rule = {
						stage: null,
						conditionsOp: 'and',
						conditions: [{ field: 'payee', op: 'is', value: testPayeeId }],
						actions: [{ field: 'category', op: 'set', value: testCategoryId }],
					};

					const createdRule = await api.createRule(rule);
					testRuleId = createdRule.id;


					const result = await node.methods.loadOptions.getRules.call(loadOptionsFunctions);

					expect(Array.isArray(result)).toBe(true);

					const testRule = result.find((r) => r.value === testRuleId);
					expect(testRule).toBeDefined();

				} catch (error) {
					if (error instanceof NodeApiError) {
						const errorMessage = (error.cause as Error)?.message || error.message;
						console.error('Caught NodeApiError:', errorMessage);
					} else {
						console.error('Caught unexpected error:', error);
					}
					throw error;
				} finally {
					// Clean up in reverse order of creation
					await api.init({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						dataDir: 'tests/dataDir',
					});
					await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
					if (testRuleId) {
						await api.deleteRule(testRuleId);
					}
					if (testCategoryId) {
						await api.deleteCategory(testCategoryId);
					}
					if (testGroupId) {
						await api.deleteCategoryGroup(testGroupId);
					}
					if (testPayeeId) {
						await api.deletePayee(testPayeeId);
					}
					await api.shutdown();
				}
			});

			it('getSchedules should return schedules from a live server', async () => {
				const loadOptionsFunctions = {
					getCredentials: jest.fn().mockResolvedValue({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						syncId: process.env.ACTUAL_SYNC_ID,
					}),
					getNode: jest.fn(),
				} as unknown as ILoadOptionsFunctions;

				const node = new ActualBudget();
				let testScheduleId: string | null = null;
				let testPayeeId: string | null = null;
				let testAccountId: string | null = null;

				try {
					const payeeName = `Test Payee for Schedule ${Date.now()}`;
					testPayeeId = await api.createPayee({ name: payeeName });

					const accountName = `Test Account for Schedule ${Date.now()}`;
					testAccountId = await api.createAccount({ name: accountName, type: 'checking' });

					const schedule = {
						payee: testPayeeId,
						account: testAccountId,
						amount: -1000,
						date: {
							start: '2025-01-01',
							frequency: 'monthly',
							patterns: [{ type: 'day', value: 15 }],
						},
					};

					testScheduleId = await api.createSchedule(schedule);

					const result = await node.methods.loadOptions.getSchedules.call(loadOptionsFunctions);

					expect(Array.isArray(result)).toBe(true);

					const testSchedule = result.find((s) => s.value === testScheduleId);
					expect(testSchedule).toBeDefined();

				} catch (error) {
					if (error instanceof NodeApiError) {
						const errorMessage = (error.cause as Error)?.message || error.message;
						console.error('Caught NodeApiError:', errorMessage);
					} else {
						console.error('Caught unexpected error:', error);
					}
					throw error;
				} finally {
					// Clean up
					await api.init({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						dataDir: 'tests/dataDir',
					});
					await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
					if (testScheduleId) {
						await api.deleteSchedule(testScheduleId);
					}
					if (testPayeeId) {
						await api.deletePayee(testPayeeId);
					}
					if (testAccountId) {
						await api.deleteAccount(testAccountId);
					}
					await api.shutdown();
				}
			});
		});
	});
	describe('execute', () => {
		describe('Integration Tests', () => {
			beforeEach(async () => {
				try {
					const dataDirPath = 'tests/dataDir';
					if (fs.existsSync(dataDirPath)) {
						fs.rmSync(dataDirPath, { recursive: true, force: true });
					}
					fs.mkdirSync(dataDirPath, { recursive: true });
					await api.init({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						dataDir: dataDirPath,
					});
					await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
				} catch (error) {
					console.error('Failed to initialize Actual Budget API:', error);
					throw error;
				}
			});

			afterEach(async () => {
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
							syncId: process.env.ACTUAL_SYNC_ID,
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
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						await api.deleteAccount(testAccountId);
						await api.shutdown();
					}
				}
			});
		});
	});
});
