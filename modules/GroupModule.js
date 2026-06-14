const mongoose = require('mongoose');
const timezonePlugin = require('../timezonePlugin');

const groupSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastMessage: {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: {
      type: String,
    },
    images: [String],
    documents: [String],
    audio: [String],
    createdAt: {
      type: Date,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
groupSchema.plugin(timezonePlugin, { timezone: 'Africa/Cairo' });


const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
