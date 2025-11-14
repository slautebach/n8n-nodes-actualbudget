import { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

/**
 * Represents the credentials for the Actual Budget API.
 */
export class ActualBudgetApi implements ICredentialType {
	name = 'actualBudgetApi';
	displayName = 'Actual Budget API';
	documentationUrl = 'https://actualbudget.org/docs/api/';
	/**
	 * The properties of the credentials.
	 */
	properties: INodeProperties[] = [
		{
			displayName: 'Server URL',
			name: 'serverURL',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
		{
			displayName: 'Sync ID',
			name: 'syncId',
			type: 'string',
			default: '',
			required: true,
			description: 'The Sync ID of the Budget you want to work on',
		},
	];

	/**
	 * The test request to verify the credentials.
	 */
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.serverURL}}',
			url: '=/account/login',
			method: 'POST',
			body: {
				loginMethod: 'password',
				password: '={{$credentials?.password}}',
			},
		},
	};
}
