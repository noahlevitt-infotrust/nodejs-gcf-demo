const { google } = require('googleapis');
const { Storage } = require('@google-cloud/storage');
const { query, body, validationResult } = require('express-validator');

// Google OAuth2 Authorization
async function getOAuth2Client() {
	const clientSecretFile = new Storage()
		.bucket('infotrust-automation-service_auth-token-repo')
		.file('client_secret.json');
	const data = await clientSecretFile.download();

	const { web } = JSON.parse(data);
	return new google.auth.OAuth2(
		web.client_id,
		web.client_secret,
		web.redirect_uris[0]
	);
}

async function getScopesFromRequestQuery(req, res) {
	await query('scopes')
		.exists().withMessage("Query parameter 'scopes' must be included.")
		.bail()
		.isArray().withMessage("Query parameter 'scopes' must be an array.")
		.run(req);

	const result = validationResult(req);
	if (!result.isEmpty()) {
		res.status(400).json({ errors: result.array() });
		return;
	}

	return req.query.scopes;
}

exports.authorize = async (req, res) => {
	const scopes = await getScopesFromRequestQuery(req, res);
	if (scopes !== undefined) {
		const oauth2Client = await getOAuth2Client();
		const authUrl = oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: scopes.map(scope => `https://www.googleapis.com/auth/${scope}`),
		});
		res.redirect(authUrl);
	}
}

exports.getAuthTokens = async (req, res) => {
	const oauth2Client = await getOAuth2Client();
	const response = await oauth2Client.getToken(req.query.code);

	res.json(response.tokens);
}

// Token Retrieval + Google API Calls
async function retrieveTokensFromRequestBody(req, res) {
	await body('tokens')
		.exists().withMessage("Body must contain field 'tokens'.")
		.bail()
		.custom(tokens => typeof tokens === 'object' && tokens !== null).withMessage("Body field 'tokens' must be a valid JSON object.")
		.bail()
		.custom(tokens => tokens.access_token !== undefined).withMessage("Body field 'tokens' must contain field 'access_token'.")
		.run(req);

	const result = validationResult(req);
	if (!result.isEmpty()) {
		res.status(400).json({ errors: result.array() });
		return;
	}

	return req.body.tokens;
}

exports.getAnalyticsAccountsList = async (req, res) => {
	const tokens = await retrieveTokensFromRequestBody(req, res);
	if (tokens !== undefined) {
		const oauth2Client = await getOAuth2Client();
		oauth2Client.credentials = tokens;

		const analytics = google.analytics({ version: 'v3', auth: oauth2Client });
		const response = await analytics.management.accounts.list();
		res.json(response.data);
	}
}

exports.getTagmanagerAccountsList = async (req, res) => {
	const tokens = await retrieveTokensFromRequestBody(req, res);
	if (tokens !== undefined) {
		const oauth2Client = await getOAuth2Client();
		oauth2Client.credentials = tokens;

		const tagmanager = google.tagmanager({ version: 'v2', auth: oauth2Client });
		const response = await tagmanager.accounts.list();
		res.json(response.data);
	}
}