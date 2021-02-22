'use strict';

/**
 * Middleware to check authorization with API key (X-API-KEY header).
 *
 * @param {object} req  Express request object
 * @param {object} res  Express response object
 * @param {function} next Express middleware function
 *
 * @returns {void}
 */
module.exports = function (req, res, next) {
    const app = req.app;
    const config = app.get('config');
    const logger = app.get('logger');
    const apiKey = req.headers['x-api-key'];

    if (!config.api || !config.api.key) {
        logger.error('API key access not configured!', req.method, req.path);

        return res.internalServerError('API key access not configured!');
    }

    if (apiKey) {
        if (apiKey === config.api.key) {
            return next();
        } else {
            return res.unauthorised('Invalid API key');
        }
    } else {
        logger.warn('Req headers', req.headers);

        return res.unauthorised('No API key presented. API key should be sent in X-API-KEY header');
    }
};
