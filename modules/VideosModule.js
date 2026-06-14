const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  isLocked: {
    type: Boolean,
    default: true,
  },
  url: {
    type: String,
    required: true,
  },
  thumbnail: {  // New field for the thumbnail URL
    type: String,
    default: null, // Default to null if no thumbnail is provided
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  educationLevel: {
    type: Number,
    enum: [1, 2, 3],
    required: true,
  },
  amountToPay: {
    type: Number,
    required: function () { return this.paid; },
  },
  paid: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
