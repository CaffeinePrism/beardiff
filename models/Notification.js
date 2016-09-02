const mongoose = require('mongoose');

const notiSchema = new mongoose.Schema({
    ts: {
        type: Date
    },
    url: {
        type: String
    }
}, {timestamps: false});

notiSchema.virtual('ts_ms').get(function() {
    return this.ts.getTime();
});

const Notification = mongoose.model('Notification', notiSchema);

module.exports = Notification;
