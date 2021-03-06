const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    ts: {
        type: Date,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    op: {
        type: String,
        required: true
    },
    newScrape: {
        type: Boolean,
        required: true
    }
}, {timestamps: false});

eventSchema.virtual('ts_ms').get(function() {
    return this.ts.getTime();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
