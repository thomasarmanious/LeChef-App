const mongoose = require('mongoose');
const timezonePlugin = require('../timezonePlugin');

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  educationLevel: {
    type: Number,
    enum: [1, 2, 3], // Define levels as required
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { id: false });

noteSchema.plugin(timezonePlugin, { timezone: 'Africa/Cairo' });

const Note = mongoose.model('Note', noteSchema);
module.exports = Note;
