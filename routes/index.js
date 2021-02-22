'use strict';

module.exports = function (app) {
    const config = app.get('config');
    const logger = app.get('logger');
    const util = app.get('util');
    const authApiKey = app.get('middleware.authApiKey');
    const mobileId = require('mobiil-id-rest')();

    mobileId.init({
        issuers: config.certificates.issuers
    });
    // TODO: Replace with persistent storage, otherwise everything is lost after server restart.
    const memoryStorage = {};

    /**
     * Authorize
     *
     * Returns token that will be used to get authorized user data
     */

    const authorize = async function (req, res, next) {
        logger.debug('Authorize', req.method, req.path, req.headers);

        let clientCert = req.headers['x-ssl-client-cert'];
        if (!clientCert) {
            logger.warn('Missing client certificate!', req.path, req.headers);

            return res.badRequest('Missing client certificate');
        }

        if(clientCert.indexOf('-----BEGIN') > -1) {
            clientCert = clientCert.replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '')
        }
        try {
            await mobileId.validateCert(clientCert, 'base64');
            let personalInfo = await mobileId.getCertUserData(clientCert, 'base64');
            personalInfo.countryCode = personalInfo.country;
            delete personalInfo.country;
            const token = util.randomString(16);
            memoryStorage[token] = {user: personalInfo};

            return res.ok({token});

        } catch (error) {
            if (error.name === 'ValidationError') {
                return res.badRequest(error.message);
            }

            return next(error);
        }
    }

    app.get('/authorize', authorize);
    app.post('/authorize', authorize);


    /**
     * Token
     *
     * Exchange token for User data.
     */
    app.get('/info', authApiKey, function (req, res) {
        logger.debug('Info', req.method, req.path, req.headers, req.query);

        const token = req.query.token;

        if (!token) {
            logger.warn('Missing required parameter "token"', req.path, req.headers);

            return res.badRequest('Missing required parameter "token"', 1);
        }

        const data = memoryStorage[token];

        if (!data) {
            logger.warn('No data found for specific token!', req.path, req.headers);

            return res.badRequest('No data found for specified token. Remember the token can be used only once.', 2);
        }

        delete memoryStorage[token];

        return res.ok(data);
    });
};
