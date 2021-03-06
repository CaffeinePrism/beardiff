'use strict';

const bluebird = require('bluebird');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const sass = require('node-sass-middleware');
const bodyParser = require('body-parser');
const events = require('events');

const mongoose = require('mongoose');
// Use native promises
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/beardiff');
const db = mongoose.connection;

const Diff = require('./models/Diff.js');
const Event = require('./models/Event.js');
const Notification = require('./models/Notification.js');
const Scrape = require('./models/Scrape.js');
const Url = require('./models/Url.js');

const spawn = require('child_process').spawn;

const routes = require('./routes/index');
const api = require('./routes/api');

const app = express();

app.locals.emitter = new events.EventEmitter();

// view engine setup
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: false}));
// app.use(cookieParser());{css}
app.use(sass({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    debug: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/scrape_data', express.static(path.join(__dirname, 'scrape')));

let partials = function(req, res) {
    let name = req.params.name;
    res.render('partials/' + name);
};
app.use('/', routes);
app.use('/api', api);
app.get('/partials/:name', partials);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

function checkUrlInit(url) {
    return new Promise(function(resolve, reject) {
        Event.findOne({
            url: url
        }).exec().then(resp => {
            resolve(Boolean(resp));
        });
    });
}

function getLastScrapeTs(url) {
    return new Promise(function(resolve, reject) {
        Event.find({url: url, newScrape: true}).sort({ts: -1}).limit(1).then(function(resp) {
            resolve(resp[0].ts_ms);
        });
    });
}

function getUrls() {
    return Url.find({}).exec();
}

const scrapeLoop = bluebird.coroutine(function * scrapeLoop() {
    let promises = [];
    for (let urlObj of yield getUrls()) {
        let params;
        let url = urlObj.url;
        let exists = yield checkUrlInit(url);
        let op;
        if (exists) {
            op = 'diff';
            let lastTs = yield getLastScrapeTs(url);
            params = ['phantom.js', 'diff', lastTs, url];
        } else {
            op = 'init';
            params = ['phantom.js', 'init', url];
        }
        console.log('Scrape:', params, urlObj);
        promises.push(new Promise(function(resolve, reject) {
            let phantom = spawn('phantomjs', params);
            phantom.stdout.on('data', data => {
                console.log(`stdout [${url}]: ${data}`);
                let result = JSON.parse(data);
                if (result.newScrape && op !== 'init') {
                    new Notification({ts: result.ts, url: result.url}).save(function(err, obj) {
                        if (err)
                            console.error(err);
                    });
                }
                new Event(result).save(function(err, obj) {
                    if (err)
                        console.error(err);
                    else {
                        console.log('saved', url);
                    }
                });
            });

            phantom.stderr.on('data', data => {
                console.log(`stderr [${url}]: ${data}`);
            });

            phantom.on('exit', code => {
                console.log(`[${url}]: child process exited with code ${code}`);
                resolve();
            });
        }));
    }
    return Promise.all(promises);
});

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    app.locals.db = db;
    app.listen(app.get('port'), () => {
        console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));

        // var scrape = function scrape() {
        //     console.log('Starting scrape loop');
        //     scrapeLoop().then(function() {
        //         console.log('Scrape loop finished');
        //         setTimeout(scrape, 6000);
        //     });
        // };
        // scrape();
    });
});

module.exports = app;
