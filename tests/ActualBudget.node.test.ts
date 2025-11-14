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

const createLoadOptionsFunctions = () => ({
	getCredentials: jest.fn().mockResolvedValue({
		serverURL: process.env.ACTUAL_SERVER_URL,
		password: process.env.ACTUAL_SERVER_PASSWORD,
		syncId: process.env.ACTUAL_SYNC_ID,
	}),
	getNode: jest.fn(),
} as unknown as ILoadOptionsFunctions);

const createExecuteFunctions = (parameters: { [key: string]: any }) => ({
	getCredentials: jest.fn().mockResolvedValue({
		serverURL: process.env.ACTUAL_SERVER_URL,
		password: process.env.ACTUAL_SERVER_PASSWORD,
		syncId: process.env.ACTUAL_SYNC_ID,
	}),
	getNode: jest.fn(),
	getNodeParameter: jest.fn((name: string) => parameters[name]),
	getInputData: jest.fn().mockReturnValue([
		{},
	]),
	helpers: {
		returnJsonArray: jest.fn((data) => data),
	},
} as unknown as IExecuteFunctions);

describe('ActualBudget Node', () => {
	beforeAll(async () => {
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

	afterAll(async () => {
		await api.shutdown();
	});

	it('should have a description', () => {
		const node = new ActualBudget();
		expect(node.description).toBeDefined();
	});


	describe('loadOptions', () => {
		describe('Integration Tests', () => {
			it('getAccounts should return accounts from a live server', async () => {
				const loadOptionsFunctions = createLoadOptionsFunctions();
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
				                }
				            });
			it('getCategories should return categories from a live server', async () => {
				const loadOptionsFunctions = createLoadOptionsFunctions();
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
				                }
				            });
			it('getCategoryGroups should return category groups from a live server', async () => {
				const loadOptionsFunctions = createLoadOptionsFunctions();
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
				                }
				            });
			it('getPayees should return payees from a live server', async () => {
				const loadOptionsFunctions = createLoadOptionsFunctions();
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
						await api.deletePayee(testPayeeId);
					}
				}
			});

			it('getRules should return rules from a live server', async () => {
				const loadOptionsFunctions = createLoadOptionsFunctions();
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
				}
			});

			it('getSchedules should return schedules from a live server', async () => {
				const loadOptionsFunctions = createLoadOptionsFunctions();

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
					if (testScheduleId) {
						await api.deleteSchedule(testScheduleId);
					}
					if (testPayeeId) {
						await api.deletePayee(testPayeeId);
					}
					if (testAccountId) {
						await api.deleteAccount(testAccountId);
					}
				}
			});
		});
	});
	describe('execute', () => {
		describe('Integration Tests', () => {
			it('get transactions should return transactions from a live server', async () => {
				const node = new ActualBudget();
				let testAccountId: string | null = null;

				try {
					const accountName = `Test Account ${Date.now()}`;
					testAccountId = await api.createAccount({ name: accountName, type: 'checking' });

					await api.addTransactions(testAccountId, [
						{
							date: '2023-10-26',
							amount: -5000,
							payee_name: 'Test Payee',
						},
					]);

					const executeFunctions = createExecuteFunctions({
						resource: 'transaction',
						operation: 'getAll',
						accountId: testAccountId,
						startDate: '2023-01-01',
						endDate: '2023-12-31',
					});

					const result = await node.execute.call(executeFunctions);

					expect(Array.isArray(result)).toBe(true);
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
					if (testAccountId) {
						await api.deleteAccount(testAccountId);
					}
				}
			});

			describe('Category Operations', () => {
				let testGroupId: string | null = null;
				let testCategoryId: string | null = null;
				const groupName = `Test Group ${Date.now()}`;
				const categoryName = `Test Category ${Date.now()}`;

				beforeEach(async () => {
					testGroupId = await api.createCategoryGroup({ name: groupName });
					testCategoryId = await api.createCategory({ name: categoryName, group_id: testGroupId as string });
				});

				afterEach(async () => {
					// Clean up in reverse order of creation
					if (testCategoryId) {
						try {
							await api.deleteCategory(testCategoryId);
						} catch (e) {
							// Ignore error if category was already deleted by the test
						}
					}
					if (testGroupId) {
						await api.deleteCategoryGroup(testGroupId);
					}
				});

				it('should get all categories', async () => {
					const node = new ActualBudget();
					const executeFunctions = createExecuteFunctions({
						resource: 'category',
						operation: 'getAll',
					});

					const result = await node.execute.call(executeFunctions);
					const categories = result[0][0].json.data;
					const testCategory = categories.find((c: any) => c.id === testCategoryId);
					expect(testCategory).toBeDefined();
					expect(testCategory.name).toBe(categoryName);
				});

				it('should create a category', async () => {
					const node = new ActualBudget();
					const newCategoryName = `New Test Category ${Date.now()}`;
					const executeFunctions = createExecuteFunctions({
						resource: 'category',
						operation: 'create',
						name: newCategoryName,
						categoryGroupId: testGroupId,
					});

					const result = await node.execute.call(executeFunctions);
					const newCategoryId = result[0][0].json.data;
					expect(newCategoryId).toBeDefined();

					try {
						// Verify the category was created
						const categories = await api.getCategories();
						const newCategory = categories.find((c: any) => c.id === newCategoryId);
						expect(newCategory).toBeDefined();
						expect(newCategory?.name).toBe(newCategoryName);
					} finally {
						// Clean up the newly created category
						await api.deleteCategory(newCategoryId);
					}
				});

				it('should update a category', async () => {
					const node = new ActualBudget();
					const updatedCategoryName = `Updated Test Category ${Date.now()}`;
					const executeFunctions = createExecuteFunctions({
						resource: 'category',
						operation: 'update',
						categoryId: testCategoryId,
						name: updatedCategoryName,
						categoryGroupId: testGroupId,
					});

					await node.execute.call(executeFunctions);

					// Verify the category was updated
					const categories = await api.getCategories();
					const updatedCategory = categories.find((c: any) => c.id === testCategoryId);
					expect(updatedCategory).toBeDefined();
					expect(updatedCategory?.name).toBe(updatedCategoryName);
				});

				it('should delete a category', async () => {
					const node = new ActualBudget();
					const executeFunctions = createExecuteFunctions({
						resource: 'category',
						operation: 'delete',
						categoryId: testCategoryId,
					});

					await node.execute.call(executeFunctions);

					// Verify the category was deleted
					const categories = await api.getCategories();
					const deletedCategory = categories.find((c: any) => c.id === testCategoryId);
					expect(deletedCategory).toBeUndefined();

					// Prevent afterEach from trying to delete it again
					testCategoryId = null;
				});
			});

			describe('Category Group Operations', () => {
				let testGroupId: string | null = null;
				const groupName = `Test Group ${Date.now()}`;

				beforeEach(async () => {
					testGroupId = await api.createCategoryGroup({ name: groupName });
				});

				afterEach(async () => {
					// Clean up
					if (testGroupId) {
						try {
							await api.deleteCategoryGroup(testGroupId);
						} catch (e) {
							// Ignore error if group was already deleted by the test
						}
					}
				});

				it('should get all category groups', async () => {
					const node = new ActualBudget();
					const executeFunctions = createExecuteFunctions({
						resource: 'categoryGroup',
						operation: 'getAll',
					});

					const result = await node.execute.call(executeFunctions);
					const groups = result[0][0].json.data;
					const testGroup = groups.find((g: any) => g.id === testGroupId);
					expect(testGroup).toBeDefined();
					expect(testGroup.name).toBe(groupName);
				});

				it('should create a category group', async () => {
					const node = new ActualBudget();
					const newGroupName = `New Test Group ${Date.now()}`;
					const executeFunctions = createExecuteFunctions({
						resource: 'categoryGroup',
						operation: 'create',
						name: newGroupName,
					});

					const result = await node.execute.call(executeFunctions);
					const newGroupId = result[0][0].json.data;
					expect(newGroupId).toBeDefined();

					try {
						// Verify the group was created
						const groups = await api.getCategoryGroups();
						const newGroup = groups.find((g: any) => g.id === newGroupId);
						expect(newGroup).toBeDefined();
						expect(newGroup?.name).toBe(newGroupName);
					} finally {
						// Clean up the newly created group
						await api.deleteCategoryGroup(newGroupId);
					}
				});

				it('should update a category group', async () => {
					const node = new ActualBudget();
					const updatedGroupName = `Updated Test Group ${Date.now()}`;
					const executeFunctions = createExecuteFunctions({
						resource: 'categoryGroup',
						operation: 'update',
						categoryGroupId: testGroupId,
						name: updatedGroupName,
					});

					await node.execute.call(executeFunctions);

					// Verify the group was updated
					const groups = await api.getCategoryGroups();
					const updatedGroup = groups.find((g: any) => g.id === testGroupId);
					expect(updatedGroup).toBeDefined();
					expect(updatedGroup?.name).toBe(updatedGroupName);
				});

				it('should delete a category group', async () => {
					const node = new ActualBudget();
					const executeFunctions = createExecuteFunctions({
						resource: 'categoryGroup',
						operation: 'delete',
						categoryGroupId: testGroupId,
					});

					await node.execute.call(executeFunctions);

					// Verify the group was deleted
					const groups = await api.getCategoryGroups();
					const deletedGroup = groups.find((g: any) => g.id === testGroupId);
					expect(deletedGroup).toBeUndefined();

					// Prevent afterEach from trying to delete it again
					testGroupId = null;
				});
			});

			describe('Account Operations', () => {
                let testAccountId: string | null = null;
                const accountName = `Test Account ${Date.now()}`;

                afterEach(async () => {
                    // Clean up the test account if it exists
                    if (testAccountId) {
                        try {
                            await api.deleteAccount(testAccountId);
                        } catch (error) {
                            // Ignore errors if the account was already deleted
                        }
                        testAccountId = null;
                    }
                });

                it('should create an account', async () => {
                    const node = new ActualBudget();
                    const executeFunctions = createExecuteFunctions({
                        resource: 'account',
                        operation: 'create',
                        name: accountName,
                        type: 'checking',
                    });

                    const result = await node.execute.call(executeFunctions);
                    testAccountId = result[0][0].json.data;
                    expect(testAccountId).toBeDefined();

                    const accounts = await api.getAccounts();
                    const newAccount = accounts.find((a: any) => a.id === testAccountId);
                    expect(newAccount).toBeDefined();
                    expect(newAccount?.name).toBe(accountName);
                });

                it('should get an account', async () => {
                    const node = new ActualBudget();
                    testAccountId = await api.createAccount({ name: accountName, type: 'checking' });

                    const executeFunctions = createExecuteFunctions({
                        resource: 'account',
                        operation: 'get',
                        accountId: testAccountId,
                    });

                    const result = await node.execute.call(executeFunctions);
                    const account = result[0][0].json.data;
                    expect(account).toBeDefined();
                    expect(account.name).toBe(accountName);
                });

                it('should update an account', async () => {
                    const node = new ActualBudget();
                    testAccountId = await api.createAccount({ name: accountName, type: 'checking' });
                    const updatedAccountName = `Updated ${accountName}`;

                    const executeFunctions = createExecuteFunctions({
                        resource: 'account',
                        operation: 'update',
                        accountId: testAccountId,
                        name: updatedAccountName,
                    });

                    await node.execute.call(executeFunctions);

                    const accounts = await api.getAccounts();
                    const updatedAccount = accounts.find((a: any) => a.id === testAccountId);
                    expect(updatedAccount).toBeDefined();
                    expect(updatedAccount?.name).toBe(updatedAccountName);
                });

                it('should close an account', async () => {
                    const node = new ActualBudget();
                    testAccountId = await api.createAccount({ name: accountName, type: 'checking' });

                    const executeFunctions = createExecuteFunctions({
                        resource: 'account',
                        operation: 'close',
                        accountId: testAccountId,
                    });

                    await node.execute.call(executeFunctions);

                    const accounts = await api.getAccounts();
                    const closedAccount = accounts.find((a: any) => a.id === testAccountId);
                    expect(closedAccount).toBeDefined();
                    expect(closedAccount?.closed).toBe(true);
                });

                it('should reopen an account', async () => {
                    const node = new ActualBudget();
                    testAccountId = await api.createAccount({ name: accountName, type: 'checking', closed: true });

                    const executeFunctions = createExecuteFunctions({
                        resource: 'account',
                        operation: 'reopen',
                        accountId: testAccountId,
                    });

                    await node.execute.call(executeFunctions);

                    const accounts = await api.getAccounts();
                    const reopenedAccount = accounts.find((a: any) => a.id === testAccountId);
                    expect(reopenedAccount).toBeDefined();
                    expect(reopenedAccount?.closed).toBe(false);
                });

                it('should delete an account', async () => {
                    const node = new ActualBudget();
                    testAccountId = await api.createAccount({ name: accountName, type: 'checking' });

                    const executeFunctions = createExecuteFunctions({
                        resource: 'account',
                        operation: 'delete',
                        accountId: testAccountId,
                    });

                    await node.execute.call(executeFunctions);

                    const accounts = await api.getAccounts();
                    const deletedAccount = accounts.find((a: any) => a.id === testAccountId);
                    expect(deletedAccount).toBeUndefined();
                    testAccountId = null; // Prevent afterEach from trying to delete it again
                });
            });

			describe('Payee Operations', () => {
                let testPayeeId: string | null = null;
                const payeeName = `Test Payee ${Date.now()}`;

                afterEach(async () => {
                    // Clean up the test payee if it exists
                    if (testPayeeId) {
                        try {
                            await api.deletePayee(testPayeeId);
                        } catch (error) {
                            // Ignore errors if the payee was already deleted
                        }
                        testPayeeId = null;
                    }
                });

                it('should create a payee', async () => {
                    const node = new ActualBudget();
                    const executeFunctions = createExecuteFunctions({
                        resource: 'payee',
                        operation: 'create',
                        name: payeeName,
                    });

                    const result = await node.execute.call(executeFunctions);
                    testPayeeId = result[0][0].json.data;
                    expect(testPayeeId).toBeDefined();

                    const payees = await api.getPayees();
                    const newPayee = payees.find((p: any) => p.id === testPayeeId);
                    expect(newPayee).toBeDefined();
                    expect(newPayee?.name).toBe(payeeName);
                });

                it('should get a payee', async () => {
                    const node = new ActualBudget();
                    testPayeeId = await api.createPayee({ name: payeeName });

                    const executeFunctions = createExecuteFunctions({
                        resource: 'payee',
                        operation: 'get',
                        payeeId: testPayeeId,
                    });

                    const result = await node.execute.call(executeFunctions);
                    const payee = result[0][0].json.data;
                    expect(payee).toBeDefined();
                    expect(payee.name).toBe(payeeName);
                });

                it('should update a payee', async () => {
                    const node = new ActualBudget();
                    testPayeeId = await api.createPayee({ name: payeeName });
                    const updatedPayeeName = `Updated ${payeeName}`;

                    const executeFunctions = createExecuteFunctions({
                        resource: 'payee',
                        operation: 'update',
                        payeeId: testPayeeId,
                        name: updatedPayeeName,
                    });

                    await node.execute.call(executeFunctions);

                    const payees = await api.getPayees();
                    const updatedPayee = payees.find((p: any) => p.id === testPayeeId);
                    expect(updatedPayee).toBeDefined();
                    expect(updatedPayee?.name).toBe(updatedPayeeName);
                });

                it('should delete a payee', async () => {
                    const node = new ActualBudget();
                    testPayeeId = await api.createPayee({ name: payeeName });

                    const executeFunctions = createExecuteFunctions({
                        resource: 'payee',
                        operation: 'delete',
                        payeeId: testPayeeId,
                    });

                    await node.execute.call(executeFunctions);

                    const payees = await api.getPayees();
                    const deletedPayee = payees.find((p: any) => p.id === testPayeeId);
                    expect(deletedPayee).toBeUndefined();
                    testPayeeId = null; // Prevent afterEach from trying to delete it again
                });
            });

			describe('Rule Operations', () => {
                let testRuleId: string | null = null;
                let testPayeeId: string | null = null;
                let testCategoryId: string | null = null;
                let testGroupId: string | null = null;

                beforeEach(async () => {
                    // A rule needs a payee and a category
                    const payeeName = `Test Payee for Rule ${Date.now()}`;
                    testPayeeId = await api.createPayee({ name: payeeName });

                    const groupName = `Test Group for Rule ${Date.now()}`;
                    testGroupId = await api.createCategoryGroup({ name: groupName });
                    const categoryName = `Test Category for Rule ${Date.now()}`;
                    testCategoryId = await api.createCategory({ name: categoryName, group_id: testGroupId as string });
                });

                afterEach(async () => {
                    // Clean up in reverse order of creation
                    if (testRuleId) {
                        try {
                            await api.deleteRule(testRuleId);
                        } catch (error) {
                            // Ignore errors if the rule was already deleted
                        }
                        testRuleId = null;
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
                });

                it('should create a rule', async () => {
                    const node = new ActualBudget();
                    const executeFunctions = createExecuteFunctions({
                        resource: 'rule',
                        operation: 'create',
                        actions: [{ field: 'category', op: 'set', value: testCategoryId }],
                        conditions: [{ field: 'payee', op: 'is', value: testPayeeId }],
                    });

                    const result = await node.execute.call(executeFunctions);
                    testRuleId = result[0][0].json.data.id;
                    expect(testRuleId).toBeDefined();

                    const rules = await api.getRules();
                    const newRule = rules.find((r: any) => r.id === testRuleId);
                    expect(newRule).toBeDefined();
                });

                it('should get a rule', async () => {
                    const node = new ActualBudget();
                    const rule = {
                        stage: null,
                        conditionsOp: 'and',
                        conditions: [{ field: 'payee', op: 'is', value: testPayeeId }],
                        actions: [{ field: 'category', op: 'set', value: testCategoryId }],
                    };
                    const createdRule = await api.createRule(rule);
                    testRuleId = createdRule.id;

                    const executeFunctions = createExecuteFunctions({
                        resource: 'rule',
                        operation: 'get',
                        ruleId: testRuleId,
                    });

                    const result = await node.execute.call(executeFunctions);
                    const fetchedRule = result[0][0].json.data;
                    expect(fetchedRule).toBeDefined();
                    expect(fetchedRule.id).toBe(testRuleId);
                });

                it('should update a rule', async () => {
                    const node = new ActualBudget();
                    const rule = {
                        stage: null,
                        conditionsOp: 'and',
                        conditions: [{ field: 'payee', op: 'is', value: testPayeeId }],
                        actions: [{ field: 'category', op: 'set', value: testCategoryId }],
                    };
                    const createdRule = await api.createRule(rule);
                    testRuleId = createdRule.id;

                    const executeFunctions = createExecuteFunctions({
                        resource: 'rule',
                        operation: 'update',
                        ruleId: testRuleId,
                        actions: [{ field: 'category', op: 'set', value: testCategoryId }],
                        conditions: [{ field: 'payee', op: 'is', value: testPayeeId }],
                        conditionsOp: 'or',
                    });

                    await node.execute.call(executeFunctions);

                    const rules = await api.getRules();
                    const updatedRule = rules.find((r: any) => r.id === testRuleId);
                    expect(updatedRule).toBeDefined();
                    expect(updatedRule?.conditions_op).toBe('or');
                });

                it('should delete a rule', async () => {
                    const node = new ActualBudget();
                    const rule = {
                        stage: null,
                        conditionsOp: 'and',
                        conditions: [{ field: 'payee', op: 'is', value: testPayeeId }],
                        actions: [{ field: 'category', op: 'set', value: testCategoryId }],
                    };
                    const createdRule = await api.createRule(rule);
                    testRuleId = createdRule.id;

                    const executeFunctions = createExecuteFunctions({
                        resource: 'rule',
                        operation: 'delete',
                        ruleId: testRuleId,
                    });

                    await node.execute.call(executeFunctions);

                    const rules = await api.getRules();
                    const deletedRule = rules.find((r: any) => r.id === testRuleId);
                    expect(deletedRule).toBeUndefined();
                    testRuleId = null; // Prevent afterEach from trying to delete it again
                });
            });

			describe('Schedule Operations', () => {
                let testScheduleId: string | null = null;
                let testPayeeId: string | null = null;
                let testAccountId: string | null = null;

                beforeEach(async () => {
                    const payeeName = `Test Payee for Schedule ${Date.now()}`;
                    testPayeeId = await api.createPayee({ name: payeeName });

                    const accountName = `Test Account for Schedule ${Date.now()}`;
                    testAccountId = await api.createAccount({ name: accountName, type: 'checking' });
                });

                afterEach(async () => {
                    if (testScheduleId) {
                        try {
                            await api.deleteSchedule(testScheduleId);
                        } catch (error) {
                            // Ignore errors if the schedule was already deleted
                        }
                        testScheduleId = null;
                    }
                    if (testPayeeId) {
                        await api.deletePayee(testPayeeId);
                    }
                    if (testAccountId) {
                        await api.deleteAccount(testAccountId);
                    }
                });

                it('should create a schedule', async () => {
                    const node = new ActualBudget();
                    const executeFunctions = createExecuteFunctions({
                        resource: 'schedule',
                        operation: 'create',
                        payeeId: testPayeeId,
                        accountId: testAccountId,
                        amount: -1000,
                        date: {
                            start: '2025-01-01',
                            frequency: 'monthly',
                            patterns: [{ type: 'day', value: 15 }],
                        },
                    });

                    const result = await node.execute.call(executeFunctions);
                    testScheduleId = result[0][0].json.data;
                    expect(testScheduleId).toBeDefined();

                    const schedules = await api.getSchedules();
                    const newSchedule = schedules.find((s: any) => s.id === testScheduleId);
                    expect(newSchedule).toBeDefined();
                });

                it('should get a schedule', async () => {
                    const node = new ActualBudget();
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

                    const executeFunctions = createExecuteFunctions({
                        resource: 'schedule',
                        operation: 'get',
                        scheduleId: testScheduleId,
                    });

                    const result = await node.execute.call(executeFunctions);
                    const fetchedSchedule = result[0][0].json.data;
                    expect(fetchedSchedule).toBeDefined();
                    expect(fetchedSchedule.id).toBe(testScheduleId);
                });

                it('should update a schedule', async () => {
                    const node = new ActualBudget();
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

                    const executeFunctions = createExecuteFunctions({
                        resource: 'schedule',
                        operation: 'update',
                        scheduleId: testScheduleId,
                        amount: -2000,
                    });

                    await node.execute.call(executeFunctions);

                    const schedules = await api.getSchedules();
                    const updatedSchedule = schedules.find((s: any) => s.id === testScheduleId);
                    expect(updatedSchedule).toBeDefined();
                    expect(updatedSchedule?.amount).toBe(-2000);
                });

                it('should delete a schedule', async () => {
                    const node = new ActualBudget();
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

                    const executeFunctions = createExecuteFunctions({
                        resource: 'schedule',
                        operation: 'delete',
                        scheduleId: testScheduleId,
                    });

                    await node.execute.call(executeFunctions);

                    const schedules = await api.getSchedules();
                    const deletedSchedule = schedules.find((s: any) => s.id === testScheduleId);
                    expect(deletedSchedule).toBeUndefined();
                    testScheduleId = null;
                });
            });

			describe('Transaction Operations', () => {
                let testAccountId: string | null = null;
                let testTransactionId: string | null = null;

                beforeEach(async () => {
                    const accountName = `Test Account for Transaction ${Date.now()}`;
                    testAccountId = await api.createAccount({ name: accountName, type: 'checking' });
                    const transactions = await api.addTransactions(testAccountId, [
                        {
                            date: '2025-01-01',
                            amount: -1000,
                            payee_name: 'Test Payee',
                        },
                    ]);
                    testTransactionId = transactions[0];
                });

                afterEach(async () => {
                    if (testAccountId) {
                        await api.deleteAccount(testAccountId);
                    }
                });

                it('should get a transaction', async () => {
                    const node = new ActualBudget();
                    const executeFunctions = createExecuteFunctions({
                        resource: 'transaction',
                        operation: 'get',
                        transactionId: testTransactionId,
                    });

                    const result = await node.execute.call(executeFunctions);
                    const transaction = result[0][0].json.data;
                    expect(transaction).toBeDefined();
                    expect(transaction.id).toBe(testTransactionId);
                });

                it('should delete a transaction', async () => {
                    const node = new ActualBudget();
                    const executeFunctions = createExecuteFunctions({
                        resource: 'transaction',
                        operation: 'delete',
                        transactionId: testTransactionId,
                    });

                    await node.execute.call(executeFunctions);

                    const transactions = await api.getTransactions(testAccountId as string, '', '');
                    const deletedTransaction = transactions.find((t: any) => t.id === testTransactionId);
                    expect(deletedTransaction).toBeUndefined();
                });
            });
		});
	});
});