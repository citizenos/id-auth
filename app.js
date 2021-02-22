'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const config = require('config');
const fs = require('fs');
const cors = require('cors');

const app = express();

if (app.get('env') === 'production') {
    app.set('trust proxy', 'loopback'); // http://expressjs.com/guide/behind-proxies.html
}

app.set('x-powered-by', false);

const log4js = require('log4js');
log4js.configure(config.logging.log4js);
const logger = log4js.getLogger(app.settings.env);

app.set('logger', logger);
app.set('config', config);
app.set('fs', fs);
app.set('util', require('./libs/util'));
app.set('middleware.authApiKey', require('./libs/middleware/authApiKey'));

// CORS
const corsOptions = config.api.cors;
corsOptions.origin.forEach(function (pattern, i) {
    corsOptions.origin[i] = new RegExp(pattern, 'i');
});
const corsMiddleware = cors(corsOptions);
app.use(corsMiddleware); // CORS
app.options('*', corsMiddleware); // Enable CORS preflight - https://github.com/expressjs/cors#enabling-cors-pre-flight

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(require('./libs/middleware/response'));

const routesPath = './routes/';
fs.readdirSync(routesPath).forEach(function (file) {
    if (!file.match(/\.js$/)) return; // Exclude folders
    require(routesPath + file)(app);
});

app.use(require('./libs/middleware/error'));

module.exports = app;
