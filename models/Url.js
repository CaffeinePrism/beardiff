const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    url: {
        type: String
    },
    operation: {
        type: String,
        default: 'GET'
    },
    data: {
        type: String,
        default: ''
    }
}, {timestamps: false});

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;
