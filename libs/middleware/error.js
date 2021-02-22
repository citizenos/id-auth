'use strict';

/**
 * Default error handler
 *
 * Hides away stack traces from the caller and log using a configured logger with a fallback to console.
 *
 * @param {object} err Error
 * @param {object} req Express request object
 * @param {object} res Express response object
 * @param {function} next Express middleware function
 *
 * @returns {void}
 */
module.exports = function (err, req, res, next) { // eslint-disable-line no-unused-vars

    const logger = req.app.get('logger') || console;

    logger.error(
        'Endpoint'
        , req.method
        , '"' + req.path + '"'
        , 'failed miserably.'
        , 'Status:', err.status
        , 'Stack:', err.stack
    );


    const status = 500;
    const message = 'Internal Server Error';

    if (req.accepts('json')) {
        return res.status(status).json({
            status: {
                code: (status + '00000').slice(0, 5),
                message: message
            }
        });
    }

    res.status(status).send(message);
};
