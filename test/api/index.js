'use strict';

var request = require('supertest-as-promised');
var assert = require('chai').assert;
var app = require('../../app');
var config = app.get('config');
var fs = require('fs');

suite('API', function () {

    suite('ID-card auth flow', function () {

        test('Success', function (done) {
            var agent = request.agent(app);
            var cert = fs.readFileSync('./test/resources/certificates/dds_good_igor_sign.pem', {encoding: 'utf8'}).replace(/\n/g, ''); //eslint-disable-line no-sync

            agent
                .post('/authorize')
                .set('X-SSL-CLIENT-CERT', cert)
                .expect(200)
                .then(function (res) {
                    assert.property(res.body.data, 'token');
                    var token = res.body.data.token;

                    return token;
                })
                .then(function (token) {
                    return agent
                        .get('/info')
                        .set('X-API-KEY', config.api.key)
                        .query({
                            token: token
                        })
                        .then(function (res) {
                            var expectedBody = {
                                status: {code: 20000},
                                data: {
                                    status: 'GOOD',
                                    user: {
                                        pid: '37101010021',
                                        firstName: 'IGOR',
                                        lastName: 'ŽAIKOVSKI',
                                        countryCode: 'EE'
                                    }
                                }
                            };

                            assert.deepEqual(res.body, expectedBody);

                            done();
                        });
                })
                .catch(done);
        });


        test('Fail - no API key', function (done) {
            var agent = request.agent(app);
            var cert = fs.readFileSync('./test/resources/certificates/dds_good_igor_sign.pem', {encoding: 'utf8'}).replace(/\n/g, ''); //eslint-disable-line no-sync

            agent
                .get('/authorize')
                .set('X-SSL-CLIENT-CERT', cert)
                .expect(200)
                .then(function (res) {
                    assert.property(res.body.data, 'token');
                    var token = res.body.data.token;

                    return token;
                })
                .then(function (token) {
                    return agent
                        .get('/info')
                        .query({
                            token: token
                        })
                        .expect(401)
                        .then(function (res) {
                            var expectedBody = {
                                status: {
                                    code: 40100,
                                    message: 'No API key presented. API key should be sent in X-API-KEY header'
                                }
                            };
                            assert.deepEqual(res.body, expectedBody);

                            done();
                        });
                })
                .catch(done);
        });

    });

});
