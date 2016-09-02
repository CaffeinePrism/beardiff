var express = require('express');
var router = express.Router();

const Event = require('../models/Event.js');
const Notification = require('../models/Notification.js');
const Url = require('../models/Url.js');


router.get('/data', function(req, res, next) {
    let urls = Url.find({}).exec();
    let events = Event.find({}).exec();
    let notis = Notification.find({}).exec();

    Promise.all([urls, events, notis]).then(ret => {
        ret.map(function(d) {
            res.write(JSON.stringify(d) + '\n\n');
        });
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

/* GET home page. */
router.get('/add', function(req, res, next) {
    res.render('add');
});

router.post('/add', function(req, res, next) {
    console.log(req.body);

    var url = req.body.url;
    var operation = req.body.method || 'GET';
    var data = req.body.data || '';

    console.log(url, operation, data);
    // res.status(200).send("POST: " + JSON.stringify(req.body));
    let query = {
        url: url,
        operation: operation,
        data: data
    };
    Url.findOneAndUpdate(query, {url: url}, {upsert:true, new:true}, function(err, doc){
        if (err) return res.send(500, { error: err });
        res.send(doc);
    });
});

module.exports = router;
