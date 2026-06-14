const mongoose = require('mongoose');
const timezonePlugin = require('../timezonePlugin');

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    type: { type: String, enum: ['note', 'video', 'quiz','pdf','payment','meeting','user'], required: true },
    level: { type: Number, required: false }, // Add the level attribute
    createdAt: { type: Date, default: Date.now },
});
notificationSchema.plugin(timezonePlugin, { timezone: 'Africa/Cairo' });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
