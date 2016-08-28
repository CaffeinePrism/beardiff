const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    ts: { type: Date },
    url: { type: String },
    op: { type: String },
    newScrape: { type: Boolean }
}, { timestamps: false });

eventSchema.virtual('ts_ms').get(function() {
  return this.ts.getTime();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
