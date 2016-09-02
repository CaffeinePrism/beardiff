var express = require('express');
var router = express.Router();

const Event = require('../models/Event.js');
const Notification = require('../models/Notification.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});

router.get('/data', function(req, res, next) {
    Event.find({}, function(err, events) {
        res.write(JSON.stringify(events) + '\n\n');
    });
    Notification.find({}, function(err, events) {
        res.write(JSON.stringify(events));
        res.end();
    });
});

router.get('/status', function(req, res, next) {
    res.render('status', {
        title: 'Express',
        data: req.app.locals.data,
        scrapeHist: req.app.locals.scrapeHist
    });
});

router.post('/', function(req, res, next) {
    console.log(req.body);

    var url = req.body.url;
    var operation = req.body.method || 'GET';
    var data = req.body.data || '';

    console.log(url, operation, data);
    // res.status(200).send("POST: " + JSON.stringify(req.body));
    if (!req.app.locals.data.addedUrls.has(url)) {
        req.app.locals.data.urls.push({
            url: url,
            operation: operation,
            data: data
        });
        req.app.locals.data.addedUrls.add(url);
        console.log(req.app.locals.data.addedUrls);
    }
    res.send(req.app.locals.data.urls);
});

module.exports = router;
