/* eslint new-cap: "off" */
const express = require('express');
const router = express.Router();

const Event = require('../models/Event.js');
const Notification = require('../models/Notification.js');
const Url = require('../models/Url.js');

router.get('/data', function(req, res, next) {
    let urls = Url.find({}).exec();
    let events = Event.find({}).exec();
    let notis = Notification.find({}).exec();

    Promise.all([urls, events, notis]).then(ret => {
        for (let d of ret) {
            res.write(JSON.stringify(d) + '\n\n');
        }
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
router.get('/api/urls', function(req, res, next) {
    Url.find({}).exec().then(data => {
        res.json({data: data});
    }).catch(err => {
        res.send(500, err);
    });
});

router.get('/api/events', function(req, res, next) {
    Event.find({}).exec().then(data => {
        res.json({data: data});
    }).catch(err => {
        res.send(500, err);
    });
});

router.get('/api/notifications', function(req, res, next) {
    Notification.find({}).exec().then(data => {
        res.json({data: data});
    }).catch(err => {
        res.send(500, err);
    });
});

router.get('/notifications', function(req, res, next) {
    Notification.find({}).exec().then(data => {
        res.render('notifications', {data: data});
    }).catch(err => {
        res.send(500, err);
    });
});

router.delete('/url/:id', function(req, res, next) {
    Url.remove({
        _id: req.params.id
    }, function(err) {
        if (err)
            return res.send(500, {error: err});
        res.send('ok');
    });
});

router.delete('/event/:id', function(req, res, next) {
    Event.remove({
        _id: req.params.id
    }, function(err) {
        if (err)
            return res.send(500, {error: err});
        res.send('ok');
    });
});

router.delete('/notification/:id', function(req, res, next) {
    Notification.remove({
        _id: req.params.id
    }, function(err) {
        if (err)
            return res.send(500, {error: err});
        res.send('ok');
    });
});

/* GET home page. */
router.get('/add', function(req, res, next) {
    res.render('add');
});

router.post('/add', function(req, res, next) {
    console.log(req.body);

    let url = req.body.url;
    let operation = req.body.method || 'GET';
    let data = req.body.data || '';

    console.log(url, operation, data);
    // res.status(200).send("POST: " + JSON.stringify(req.body));
    let query = {
        url: url,
        operation: operation,
        data: data
    };
    Url.findOneAndUpdate(query, {
        url: url
    }, {
        upsert: true,
        new: true
    }, function(err, doc) {
        if (err)
            return res.send(500, {error: err});
        res.send(doc);
    });
});

module.exports = router;
