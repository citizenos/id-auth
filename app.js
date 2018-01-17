'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var config = require('config');
var fs = require('fs');
var cors = require('cors');

var app = express();

if (app.get('env') === 'production') {
    app.set('trust proxy', 'loopback'); // http://expressjs.com/guide/behind-proxies.html
}

app.set('x-powered-by', false);

var log4js = require('log4js');
log4js.configure(config.logging.log4js);
var logger = log4js.getLogger(app.settings.env);

app.set('logger', logger);
app.set('config', config);
app.set('fs', fs);
app.set('ddsClient', require('./libs/ddsClient'));
app.set('util', require('./libs/util'));
app.set('middleware.authApiKey', require('./libs/middleware/authApiKey'));

// CORS
var corsOptions = config.api.cors;
corsOptions.origin.forEach(function (pattern, i) {
    corsOptions.origin[i] = new RegExp(pattern, 'i');
});
var corsMiddleware = cors(corsOptions);
app.use(corsMiddleware); // CORS
app.options('*', corsMiddleware); // Enable CORS preflight - https://github.com/expressjs/cors#enabling-cors-pre-flight

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(require('./libs/middleware/response'));

var routesPath = './routes/';
fs.readdirSync(routesPath).forEach(function (file) {
    if (!file.match(/\.js$/)) return; // Exclude folders
    require(routesPath + file)(app);
});

app.use(require('./libs/middleware/error'));

module.exports = app;
