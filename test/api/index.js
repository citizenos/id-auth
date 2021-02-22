'use strict';

const request = require('supertest');
const assert = require('chai').assert;
const app = require('../../app');
const config = app.get('config');
const fs = require('fs');

suite('API', function () {

    suite('ID-card auth flow', function () {

        test('Success', async function () {
            const agent = request.agent(app);
            const cert = fs.readFileSync('./test/resources/certificates/dds_good_igor_sign.pem', {encoding: 'utf8'}).replace(/\n/g, ''); //eslint-disable-line no-sync

            const res = await agent
                .get('/authorize')
                .set('X-SSL-CLIENT-CERT', cert)
                .expect(200);
            assert.property(res.body.data, 'token');
            const token = res.body.data.token;
            const resInfo = await agent
                .get('/info')
                .set('X-API-KEY', config.api.key)
                .query({
                    token: token
                });

            const expectedBody = {
                status: {code: 20000},
                data: {
                    user: {
                        pid: '37101010021',
                        firstName: 'IGOR',
                        lastName: 'ŽAIKOVSKI',
                        countryCode: 'EE'
                    }
                }
            };

            assert.deepEqual(resInfo.body, expectedBody);
        });


        test('Fail - no API key', async function () {
            const agent = request.agent(app);
            const cert = fs.readFileSync('./test/resources/certificates/dds_good_igor_sign.pem', {encoding: 'utf8'}).replace(/\n/g, ''); //eslint-disable-line no-sync

            const res = await agent
                .get('/authorize')
                .set('X-SSL-CLIENT-CERT', cert)
                .expect(200);
            assert.property(res.body.data, 'token');
            const token = res.body.data.token;

            const resInfo = await agent
                        .get('/info')
                        .query({
                            token: token
                        })
                        .expect(401);
            const expectedBody = {
                status: {
                    code: 40100,
                    message: 'No API key presented. API key should be sent in X-API-KEY header'
                }
            };
            assert.deepEqual(resInfo.body, expectedBody);
        });

    });

});
