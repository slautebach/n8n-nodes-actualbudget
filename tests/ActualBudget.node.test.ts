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

		describe('Accounts', () => {
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

		describe('Categories', () => {
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

			describe('execute', () => {
				it('get all categories', async () => {
					const node = new ActualBudget();
					let testGroupId: string | null = null;
					let testCategoryId: string | null = null;
					const categoryName = `Test Category ${Date.now()}`;
					const groupName = `Test Group ${Date.now()}`;

					try {
						testGroupId = await api.createCategoryGroup({ name: groupName });
						testCategoryId = await api.createCategory({ name: categoryName, group_id: testGroupId as string });

						const executeFunctions = {
							getCredentials: jest.fn().mockResolvedValue({
								serverURL: process.env.ACTUAL_SERVER_URL,
								password: process.env.ACTUAL_SERVER_PASSWORD,
								syncId: process.env.ACTUAL_SYNC_ID,
							}),
							getNode: jest.fn(),
							getNodeParameter: jest.fn((name: string) => {
								if (name === 'resource') return 'category';
								if (name === 'operation') return 'getAll';
								return null;
							}),
							getInputData: jest.fn().mockReturnValue([
								{},
							]),
							helpers: {
								returnJsonArray: jest.fn((data) => data),
							},
							continueOnFail: jest.fn().mockReturnValue(false),
						} as unknown as IExecuteFunctions;

						const result = await node.execute.call(executeFunctions);
						expect(Array.isArray(result[0][0].json.data)).toBe(true);
						const categories = result[0][0].json.data;
						const foundCategory = categories.find((cat: any) => cat.id === testCategoryId && cat.name === categoryName);
						expect(foundCategory).toBeDefined();

					} catch (error: any) {
						if (error instanceof NodeApiError) {
							const errorMessage = (error.cause as Error)?.message || error.message;
							console.error('Caught NodeApiError:', errorMessage);
						} else {
							console.error('Caught unexpected error:', error);
						}
						throw error;
					} finally {
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

				it('delete a category', async () => {
					const node = new ActualBudget();
					let testGroupId: string | null = null;
					let testCategoryId: string | null = null;
					const categoryName = `Test Category ${Date.now()}`;
					const groupName = `Test Group ${Date.now()}`;

					try {
						testGroupId = await api.createCategoryGroup({ name: groupName });
						testCategoryId = await api.createCategory({ name: categoryName, group_id: testGroupId as string });

						const executeFunctions = {
							getCredentials: jest.fn().mockResolvedValue({
								serverURL: process.env.ACTUAL_SERVER_URL,
								password: process.env.ACTUAL_SERVER_PASSWORD,
								syncId: process.env.ACTUAL_SYNC_ID,
							}),
							getNode: jest.fn(),
							getNodeParameter: jest.fn((name: string) => {
								if (name === 'resource') return 'category';
								if (name === 'operation') return 'delete';
								if (name === 'categoryId') return testCategoryId;
								return null;
							}),
							getInputData: jest.fn().mockReturnValue([
								{},
							]),
							helpers: {
								returnJsonArray: jest.fn((data) => data),
							},
							continueOnFail: jest.fn().mockReturnValue(false),
						} as unknown as IExecuteFunctions;

						const result = await node.execute.call(executeFunctions);
						expect(result[0][0].json.data.success).toBe(true);

						// Verify the category was deleted
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						const categories = await api.getCategories();
						const deletedCategory = categories.find(cat => cat.id === testCategoryId);
						expect(deletedCategory).toBeUndefined();
					} catch (error: any) {
						if (error instanceof NodeApiError) {
							const errorMessage = (error.cause as Error)?.message || error.message;
							console.error('Caught NodeApiError:', errorMessage);
						} else {
							console.error('Caught unexpected error:', error);
						}
						throw error;
					} finally {
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						if (testGroupId) {
							await api.deleteCategoryGroup(testGroupId);
						}
						await api.shutdown();
					}
				});

				it('delete a category group', async () => {
					const node = new ActualBudget();
					let testGroupId: string | null = null;
					const groupName = `Test Group ${Date.now()}`;

					try {
						testGroupId = await api.createCategoryGroup({ name: groupName });

						const executeFunctions = {
							getCredentials: jest.fn().mockResolvedValue({
								serverURL: process.env.ACTUAL_SERVER_URL,
								password: process.env.ACTUAL_SERVER_PASSWORD,
								syncId: process.env.ACTUAL_SYNC_ID,
							}),
							getNode: jest.fn(),
							getNodeParameter: jest.fn((name: string) => {
								if (name === 'resource') return 'categoryGroup';
								if (name === 'operation') return 'delete';
								if (name === 'categoryGroupId') return testGroupId;
								return null;
							}),
							getInputData: jest.fn().mockReturnValue([
								{},
							]),
							helpers: {
								returnJsonArray: jest.fn((data) => data),
							},
							continueOnFail: jest.fn().mockReturnValue(false),
						} as unknown as IExecuteFunctions;

						const result = await node.execute.call(executeFunctions);
						expect(result[0][0].json.data.success).toBe(true);

						// Verify the category group was deleted
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						const categoryGroups = await api.getCategoryGroups();
						const deletedGroup = categoryGroups.find(group => group.id === testGroupId);
						expect(deletedGroup).toBeUndefined();
					} catch (error) {
						if (error instanceof NodeApiError) {
							const errorMessage = (error.cause as Error)?.message || error.message;
							console.error('Caught NodeApiError:', errorMessage);
						} else {
							console.error('Caught unexpected error:', error);
						}
						throw error;
					}
				});
			});
		});

		describe('Payees', () => {
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
			describe('execute', () => {
				it('create a payee', async () => {
					const node = new ActualBudget();
					let testPayeeId: string | null = null;
					const payeeName = `New Payee ${Date.now()}`;

					try {
						const executeFunctions = {
							getCredentials: jest.fn().mockResolvedValue({
								serverURL: process.env.ACTUAL_SERVER_URL,
								password: process.env.ACTUAL_SERVER_PASSWORD,
								syncId: process.env.ACTUAL_SYNC_ID,
							}),
							getNode: jest.fn(),
							getNodeParameter: jest.fn((name: string) => {
								if (name === 'resource') return 'payee';
								if (name === 'operation') return 'create';
								if (name === 'name') return payeeName;
								if (name === 'transferAccountId') return '';
								return null;
							}),
							getInputData: jest.fn().mockReturnValue([
								{},
							]),
							helpers: {
								returnJsonArray: jest.fn((data) => data),
							},
							continueOnFail: jest.fn().mockReturnValue(false),
						} as unknown as IExecuteFunctions;

						const result = await node.execute.call(executeFunctions);
						expect(typeof result[0][0].json.data).toBe('string'); // Expecting the ID string
						testPayeeId = result[0][0].json.data;

						// Verify the payee was created by fetching it
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						const payees = await api.getPayees();
						const createdPayee = payees.find(p => p.id === testPayeeId);
						expect(createdPayee).toBeDefined();
						expect(createdPayee?.name).toBe(payeeName);

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

				it('update a payee', async () => {
					const node = new ActualBudget();
					let testPayeeId: string | null = null;
					const originalPayeeName = `Original Payee ${Date.now()}`;
					const updatedPayeeName = `Updated Payee ${Date.now()}`;

					try {
						testPayeeId = await api.createPayee({ name: originalPayeeName });

						const executeFunctions = {
							getCredentials: jest.fn().mockResolvedValue({
								serverURL: process.env.ACTUAL_SERVER_URL,
								password: process.env.ACTUAL_SERVER_PASSWORD,
								syncId: process.env.ACTUAL_SYNC_ID,
							}),
							getNode: jest.fn(),
														getNodeParameter: jest.fn((name: string) => {
															if (name === 'resource') return 'payee';
															if (name === 'operation') return 'update';
															if (name === 'payeeId') {
																console.log('payeeId in mock:', testPayeeId);
																return testPayeeId;
															}
															if (name === 'name') return updatedPayeeName;
															if (name === 'transferAccountId') return undefined;
															return null;
														}),
							getInputData: jest.fn().mockReturnValue([
								{},
							]),
							helpers: {
								returnJsonArray: jest.fn((data) => data),
							},
							continueOnFail: jest.fn().mockReturnValue(false),
						} as unknown as IExecuteFunctions;

						const result = await node.execute.call(executeFunctions);
						expect(result[0][0].json.data.success).toBe(true);

						// Verify the payee was updated
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						const payees = await api.getPayees();
						const updatedPayee = payees.find(p => p.id === testPayeeId);
						expect(updatedPayee).toBeDefined();
						expect(updatedPayee?.name).toBe(updatedPayeeName);

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

				it('get a payee', async () => {
					const node = new ActualBudget();
					let testPayeeId: string | null = null;
					const payeeName = `Get Payee ${Date.now()}`;

					try {
						testPayeeId = await api.createPayee({ name: payeeName });

						const executeFunctions = {
							getCredentials: jest.fn().mockResolvedValue({
								serverURL: process.env.ACTUAL_SERVER_URL,
								password: process.env.ACTUAL_SERVER_PASSWORD,
								syncId: process.env.ACTUAL_SYNC_ID,
							}),
							getNode: jest.fn(),
							getNodeParameter: jest.fn((name: string) => {
								if (name === 'resource') return 'payee';
								if (name === 'operation') return 'get';
								if (name === 'payeeId') return testPayeeId;
								return null;
							}),
							getInputData: jest.fn().mockReturnValue([
								{},
							]),
							helpers: {
								returnJsonArray: jest.fn((data) => data),
							},
							continueOnFail: jest.fn().mockReturnValue(false),
						} as unknown as IExecuteFunctions;

						const result = await node.execute.call(executeFunctions);
						expect(result[0][0].json.data).toHaveProperty('id', testPayeeId);
						expect(result[0][0].json.data).toHaveProperty('name', payeeName);

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

				it('get many payees', async () => {
					const node = new ActualBudget();
					let testPayeeId1: string | null = null;
					let testPayeeId2: string | null = null;
					const payeeName1 = `Get Many Payee 1 ${Date.now()}`;
					const payeeName2 = `Get Many Payee 2 ${Date.now()}`;

					try {
						testPayeeId1 = await api.createPayee({ name: payeeName1 });
						testPayeeId2 = await api.createPayee({ name: payeeName2 });

						const executeFunctions = {
							getCredentials: jest.fn().mockResolvedValue({
								serverURL: process.env.ACTUAL_SERVER_URL,
								password: process.env.ACTUAL_SERVER_PASSWORD,
								syncId: process.env.ACTUAL_SYNC_ID,
							}),
							getNode: jest.fn(),
							getNodeParameter: jest.fn((name: string) => {
								if (name === 'resource') return 'payee';
								if (name === 'operation') return 'getMany';
								return null;
							}),
							getInputData: jest.fn().mockReturnValue([
								{},
							]),
							helpers: {
								returnJsonArray: jest.fn((data) => data),
							},
							continueOnFail: jest.fn().mockReturnValue(false),
						} as unknown as IExecuteFunctions;

						const result = await node.execute.call(executeFunctions);
						expect(Array.isArray(result[0][0].json.data)).toBe(true);
						const payees = result[0][0].json.data;
						expect(payees.some((p: any) => p.id === testPayeeId1 && p.name === payeeName1)).toBe(true);
						expect(payees.some((p: any) => p.id === testPayeeId2 && p.name === payeeName2)).toBe(true);

					} catch (error) {
						if (error instanceof NodeApiError) {
							const errorMessage = (error.cause as Error)?.message || error.message;
							console.error('Caught NodeApiError:', errorMessage);
						} else {
							console.error('Caught unexpected error:', error);
						}
						throw error;
					} finally {
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						if (testPayeeId1) {
							await api.deletePayee(testPayeeId1);
						}
						if (testPayeeId2) {
							await api.deletePayee(testPayeeId2);
						}
						await api.shutdown();
					}
				});

				it('delete a payee', async () => {
					const node = new ActualBudget();
					let testPayeeId: string | null = null;
					const payeeName = `Delete Payee ${Date.now()}`;

					try {
						testPayeeId = await api.createPayee({ name: payeeName });

						const executeFunctions = {
							getCredentials: jest.fn().mockResolvedValue({
								serverURL: process.env.ACTUAL_SERVER_URL,
								password: process.env.ACTUAL_SERVER_PASSWORD,
								syncId: process.env.ACTUAL_SYNC_ID,
							}),
							getNode: jest.fn(),
							getNodeParameter: jest.fn((name: string) => {
								if (name === 'resource') return 'payee';
								if (name === 'operation') return 'delete';
								if (name === 'payeeId') return testPayeeId;
								return null;
							}),
							getInputData: jest.fn().mockReturnValue([
								{},
							]),
							helpers: {
								returnJsonArray: jest.fn((data) => data),
							},
							continueOnFail: jest.fn().mockReturnValue(false),
						} as unknown as IExecuteFunctions;

						const result = await node.execute.call(executeFunctions);
						expect(result[0][0].json.data.success).toBe(true);

						// Verify the payee was deleted
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						const payees = await api.getPayees();
						const deletedPayee = payees.find(p => p.id === testPayeeId);
						expect(deletedPayee).toBeUndefined();

					} catch (error) {
						if (error instanceof NodeApiError) {
							const errorMessage = (error.cause as Error)?.message || error.message;
							console.error('Caught NodeApiError:', errorMessage);
						} else {
							console.error('Caught unexpected error:', error);
						}
						throw error;
					}
				});

				it('merge payees', async () => {
					const node = new ActualBudget();
					let sourcePayeeId: string | null = null;
					let targetPayeeId: string | null = null;
					const sourcePayeeName = `Source Payee ${Date.now()}`;
					const targetPayeeName = `Target Payee ${Date.now()}`;

					try {
						sourcePayeeId = await api.createPayee({ name: sourcePayeeName });
						targetPayeeId = await api.createPayee({ name: targetPayeeName });

						const executeFunctions = {
							getCredentials: jest.fn().mockResolvedValue({
								serverURL: process.env.ACTUAL_SERVER_URL,
								password: process.env.ACTUAL_SERVER_PASSWORD,
								syncId: process.env.ACTUAL_SYNC_ID,
							}),
							getNode: jest.fn(),
							getNodeParameter: jest.fn((name: string) => {
								if (name === 'resource') return 'payee';
								if (name === 'operation') return 'merge';
								if (name === 'payeeId') return sourcePayeeId;
								if (name === 'targetPayeeId') return targetPayeeId;
								return null;
							}),
							getInputData: jest.fn().mockReturnValue([
								{},
							]),
							helpers: {
								returnJsonArray: jest.fn((data) => data),
							},
							continueOnFail: jest.fn().mockReturnValue(false),
						} as unknown as IExecuteFunctions;

						const result = await node.execute.call(executeFunctions);
						expect(result[0][0].json.data.success).toBe(true);

						// Verify source payee is deleted and target payee still exists
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						const payees = await api.getPayees();
						const deletedPayee = payees.find(p => p.id === sourcePayeeId);
						const existingPayee = payees.find(p => p.id === targetPayeeId);
						expect(deletedPayee).toBeUndefined();
						expect(existingPayee).toBeDefined();

					} catch (error) {
						if (error instanceof NodeApiError) {
							const errorMessage = (error.cause as Error)?.message || error.message;
							console.error('Caught NodeApiError:', errorMessage);
						} else {
							console.error('Caught unexpected error:', error);
						}
						throw error;
					} finally {
						await api.init({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							dataDir: 'tests/dataDir',
						});
						await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
						if (targetPayeeId) {
							await api.deletePayee(targetPayeeId);
						}
						await api.shutdown();
					}
				});

				it('get payee rules', async () => {
					const node = new ActualBudget();
					let testPayeeId: string | null = null;
					let testRuleId: string | null = null;
					let testCategoryId: string | null = null;
					let testGroupId: string | null = null;
					const payeeName = `Payee With Rules ${Date.now()}`;

					try {
						testPayeeId = await api.createPayee({ name: payeeName });

						const groupName = `Test Group for Payee Rule ${Date.now()}`;
						testGroupId = await api.createCategoryGroup({ name: groupName });
						const categoryName = `Test Category for Payee Rule ${Date.now()}`;
						testCategoryId = await api.createCategory({ name: categoryName, group_id: testGroupId as string });

						const rule = {
							stage: null,
							conditionsOp: 'and',
							conditions: [{ field: 'payee', op: 'is', value: testPayeeId }],
							actions: [{ field: 'category', op: 'set', value: testCategoryId }],
						};

						const createdRule = await api.createRule(rule);
						testRuleId = createdRule.id;

						const executeFunctions = {
							getCredentials: jest.fn().mockResolvedValue({
								serverURL: process.env.ACTUAL_SERVER_URL,
								password: process.env.ACTUAL_SERVER_PASSWORD,
								syncId: process.env.ACTUAL_SYNC_ID,
							}),
							getNode: jest.fn(),
							getNodeParameter: jest.fn((name: string) => {
								if (name === 'resource') return 'payee';
								if (name === 'operation') return 'getRules';
								if (name === 'payeeId') return testPayeeId;
								return null;
							}),
							getInputData: jest.fn().mockReturnValue([
								{},
							]),
							helpers: {
								returnJsonArray: jest.fn((data) => data),
							},
							continueOnFail: jest.fn().mockReturnValue(false),
						} as unknown as IExecuteFunctions;

						const result = await node.execute.call(executeFunctions);
						expect(Array.isArray(result[0][0].json.data)).toBe(true);
						expect(result[0][0].json.data.some((r: any) => r.id === testRuleId)).toBe(true);

					} catch (error) {
						if (error instanceof NodeApiError) {
							const errorMessage = (error.cause as Error)?.message || error.message;
							console.error('Caught NodeApiError:', errorMessage);
						} else {
							console.error('Caught unexpected error:', error);
						}
						throw error;
					} finally {
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
			});
		});

		describe('Rules', () => {
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
		});

		describe('Schedules', () => {
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

		describe('Transactions', () => {
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

			it('import transactions', async () => {
				const node = new ActualBudget();
				let testAccountId: string | null = null;
				const accountName = `Test Account ${Date.now()}`;
				const payeeName = `Imported Payee ${Date.now()}`;
				const transactionAmount = -500; // in cents

				try {
					testAccountId = await api.createAccount({ name: accountName, type: 'checking' });

					const transactionsToImport = [
						{
							date: '2023-11-15',
							amount: transactionAmount,
							payee_name: payeeName,
							imported_id: `import-id-${Date.now()}`,
						},
					];

					const executeFunctions = {
						getCredentials: jest.fn().mockResolvedValue({
							serverURL: process.env.ACTUAL_SERVER_URL,
							password: process.env.ACTUAL_SERVER_PASSWORD,
							syncId: process.env.ACTUAL_SYNC_ID,
						}),
						getNode: jest.fn(),
						getNodeParameter: jest.fn((name: string) => {
							if (name === 'resource') return 'transaction';
							if (name === 'operation') return 'import';
							if (name === 'accountId') return testAccountId;
							if (name === 'transactions') return transactionsToImport;
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
					expect(result[0][0].json.data.success).toBe(true);

					// Verify the transaction was imported
					await api.init({
						serverURL: process.env.ACTUAL_SERVER_URL,
						password: process.env.ACTUAL_SERVER_PASSWORD,
						dataDir: 'tests/dataDir',
					});
					await api.downloadBudget(process.env.ACTUAL_SYNC_ID as string);
					const transactions = await api.getTransactions(testAccountId, '2023-01-01', '2023-12-31');
					const importedTransaction = transactions.find(t => t.imported_payee === payeeName && t.amount === transactionAmount);
					expect(importedTransaction).toBeDefined();

				} catch (error) {
					if (error instanceof NodeApiError) {
						const errorMessage = (error.cause as Error)?.message || error.message;
						console.error('Caught NodeApiError:', errorMessage);
					} else {
						console.error('Caught unexpected error:', error);
					}
					throw error;
				} finally {
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
		});
	});
});
