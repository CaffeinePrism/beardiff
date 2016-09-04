/* eslint new-cap: "off" */
const express = require('express');
const router = express.Router();

const Diff = require('../models/Diff.js');
const Event = require('../models/Event.js');
const Notification = require('../models/Notification.js');
const Scrape = require('../models/Scrape.js');
const Url = require('../models/Url.js');

router.get('/urls', function(req, res, next) {
    Url.find({}).exec().then(data => {
        res.json({data: data});
    }).catch(err => {
        res.status(500).send(err);
    });
});

router.get('/events', function(req, res, next) {
    Event.find({}).exec().then(data => {
        res.json({data: data});
    }).catch(err => {
        res.status(500).send(err);
    });
});

router.get('/notifications', function(req, res, next) {
    Notification.find({}).exec().then(data => {
        res.json({data: data});
    }).catch(err => {
        res.status(500).send(err);
    });
});

router.get('/scrapes/:id/img', function(req, res, next) {
    Scrape.findOne({_id: req.params.id}).exec().then(data => {
        res.set('Content-Type', 'image/png');
        res.send(data.ss);
    });
});

router.get('/scrapes/ts/:ts/img', function(req, res, next) {
    Scrape.findOne({ts: new Date(parseInt(req.params.ts, 10))}).exec().then(data => {
        res.set('Content-Type', 'image/png');
        res.send(data.ss);
    }).catch(err => {
        console.log(err);
    });
});

router.get('/scrapes/ts/:ts/tree', function(req, res, next) {
    Scrape.findOne({ts: new Date(parseInt(req.params.ts, 10))}).exec().then(data => {
        res.send(data.tree);
    }).catch(err => {
        console.log(err);
    });
});

// router.get('/scrapes/:url/:ts/img', function(req, res, next) {
//     Scrape.findOne({url: req.params.url, ts: req.params.ts}).exec().then(data => {
//         res.send(data.ss);
//     });
// });

router.post('/scrapes', function(req, res, next) {
    let obj = {
        ts: req.body.ts,
        url: req.body.url,
        tree: JSON.stringify(req.body.tree),
        ss: Buffer.from(req.body.ss, 'base64')
    };
    new Scrape(obj).save(function(err, obj) {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.sendStatus(200);
    });
});

router.post('/diffs', function(req, res, next) {
    let obj = {
        tsLeft: req.body.tsLeft,
        tsRight: req.body.tsRight,
        url: req.body.url,
        diff: Buffer.from(req.body.diff, 'base64')
    };
    new Diff(obj).save(function(err, obj) {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.sendStatus(200);
    });
});

router.get('/diffs/:tsl/:tsr/img', function(req, res, next) {
    Diff.findOne({tsLeft: req.params.tsl, tsRight: req.params.tsr}).exec().then(data => {
        res.set('Content-Type', 'image/png');
        res.send(data.diff);
    });
});

module.exports = router;
