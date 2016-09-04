const mongoose = require('mongoose');

const diffSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    tsLeft: {
        type: Date,
        required: true
    },
    tsRight: {
        type: Date,
        required: true
    },
    diff: {
        type: Buffer,
        required: true
    }
}, {timestamps: false});

const Diff = mongoose.model('Diff', diffSchema);

module.exports = Diff;
