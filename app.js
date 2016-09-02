"use strict";

var bluebird = require('bluebird');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var sass = require('node-sass-middleware');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var events = require('events');

const mongoose = require('mongoose');
// Use native promises
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/beardiff');
var db = mongoose.connection;

const Event = require('./models/Event.js');
const Notification = require('./models/Notification.js');

const spawn = require('child_process').spawn;

var routes = require('./routes/index');

var app = express();

app.locals.data = {
    addedUrls: new Set(),
    urls: [{
        url: "http://google.com",
        operation: "GET",
        data: ""
    }, {
        url: "http://reddit.com/new",
        operation: "GET",
        data: ""
    }]
};

app.locals.emitter = new events.EventEmitter();


// view engine setup
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
// app.use(cookieParser());{css}
app.use(sass({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    debug: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/scrape_data', express.static(path.join(__dirname, 'scrape')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
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


db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    app.locals.db = db;
    app.listen(app.get('port'), () => {
        console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
        console.log('Starting scrape loop');
        scrapeLoop().then(function() {
            console.log('Scrape loop finished');
        });
    });
});


function checkUrlInit(url) {
    return new Promise(function(resolve, reject) {
        Event.findOne({
            'url': url
        }, function(err, resp) {
            resolve(!!resp);
        });
    });
}

function getLastScrapeTs(url) {
    return new Promise(function(resolve, reject) {
        Event.find({
            'url': url,
            'newScrape': true
        }).sort({
            'ts': -1
        }).limit(1).then(function(resp) {
            resolve(resp[0].ts_ms);
        });
    });
}

const scrapeLoop = bluebird.coroutine(function* scrapeLoop() {
    const comparator = (a, b) => b - a; // highest first
    let promises = []
    for (let urlObj of app.locals.data.urls) {
        let params;
        let url = urlObj.url;
        let exists = yield checkUrlInit(url);
        if (!exists) {
            let op = 'init';
            params = ['phantom.js', 'init', url];
        } else {
            let op = 'diff';
            let lastTs = yield getLastScrapeTs(url);
            params = ['phantom.js', 'diff', lastTs, url];
        }
        console.log("Scrape:", params, urlObj);
        promises.push(new Promise(function(resolve, reject) {
            let phantom = spawn('phantomjs', params);
            phantom.stdout.on('data', (data) => {
                console.log(`stdout [${url}]: ${data}`);
                let result = JSON.parse(data);
                if (result.newScrape) {
                    new Notification({
                        ts: result.ts,
                        url: result.url
                    }).save(function(err, obj) {
                        if (err) console.error(err);
                    });
                }
                new Event(result).save(function(err, obj) {
                    if (err) console.error(err);
                    else {
                        console.log('saved', url);
                    }
                });
            });

            phantom.stderr.on('data', (data) => {
                console.log(`stderr [${url}]: ${data}`);
            });

            phantom.on('exit', (code) => {
                console.log(`[${url}]: child process exited with code ${code}`);
                resolve();
            });
        }));
    }
    return Promise.all(promises);
});

module.exports = app;
