const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
  },
  description: String,
  date: {
    type: Date,
    required: true,
  },
  hostUrl: {
    type: String,
    required: true,
  },
  joinUrl: {
    type: String,
    required: true, // Zoom Join URL for participants
  },
  zoomMeetingId: {
    type: String,
    required: true, // Unique Zoom meeting ID
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  level: {
    type: String,
    required: true, // Educational level of the session
    enum: ['1', '2', '3'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
