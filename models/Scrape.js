const mongoose = require('mongoose');

const scrapeSchema = new mongoose.Schema({
    ts: {
        type: Date,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    tree: {
        type: String,
        required: true
    },
    ss: {
        type: Buffer,
        required: true
    }
}, {timestamps: false});

const Scrape = mongoose.model('Scrape', scrapeSchema);

module.exports = Scrape;
