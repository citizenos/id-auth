'use strict';

module.exports = function (app) {
    var config = app.get('config');
    var logger = app.get('logger');
    var DigiDocServiceClient = app.get('ddsClient');
    var util = app.get('util');
    var authApiKey = app.get('middleware.authApiKey');

    // TODO: Replace with persistent storage, otherwise everything is lost after server restart.
    var memoryStorage = {};

    var authorize = function (req, res, next) {
        logger.debug('Authorize', req.method, req.path, req.headers);

        var clientCert = req.headers['x-ssl-client-cert'];
        if (!clientCert) {
            logger.warn('Missing client certificate!', req.path, req.headers);

            return res.badRequest('Missing client certificate');
        }

        var ddsClient = new DigiDocServiceClient(config.services.digiDoc.serviceWsdlUrl, config.services.digiDoc.serviceName, config.services.digiDoc.token);
        ddsClient
            .checkCertificate(clientCert, false)
            .spread(function (checkCertificateResult) {
                var data = {
                    status: checkCertificateResult.Status.$value
                };

                switch (data.status) { // GOOD, UNKNOWN, EXPIRED, SUSPENDED
                    case 'GOOD':
                        data.user = {
                            pid: checkCertificateResult.UserIDCode.$value,
                            firstName: checkCertificateResult.UserGivenname.$value,
                            lastName: checkCertificateResult.UserSurname.$value,
                            countryCode: checkCertificateResult.UserCountry.$value // UPPERCASE ISO-2 letter
                        };
                        break;
                    case 'SUSPENDED':
                    case 'EXPIRED':
                    case 'UNKNOWN':
                        // Not giving User data for such cases - you're not supposed to use it anyway
                        logger.warn('Invalid certificate status', data.status);
                        break;
                    default:
                        logger.error('Unexpected certificate status from DDS', data.status);
                        res.internalServerError();

                        return Promise.reject();
                }

                var token = util.randomString(16);
                memoryStorage[token] = data;

                return res.ok({token: token});
            })
            .catch(next);
    };

    /**
     * Authorize
     *
     * Returns token that will be used to get authorized user data
     */
    app.get('/authorize', authorize);
    app.post('/authorize', authorize);


    /**
     * Token
     *
     * Exchange token for User data.
     */
    app.get('/info', authApiKey, function (req, res) {
        logger.debug('Info', req.method, req.path, req.headers, req.query);

        var token = req.query.token;

        if (!token) {
            logger.warn('Missing required parameter "token"', req.path, req.headers);

            return res.badRequest('Missing required parameter "token"', 1);
        }

        var data = memoryStorage[token];

        if (!data) {
            logger.warn('No data found for specific token!', req.path, req.headers);

            return res.badRequest('No data found for specified token. Remember the token can be used only once.', 2);
        }

        delete memoryStorage[token];

        return res.ok(data);
    });
};
