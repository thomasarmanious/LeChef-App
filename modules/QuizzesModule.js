const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  questions: [{
    question: {
      type: String,
      required: true,
    },
    options: [{
      type: String,
      required: true,
    }],
    answer: {
      type: String,
      required: true,
    },
  }],
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isLocked: {
    type: Boolean,
    default: true, // Default to locked
  },
  duration: {
    hours: {
      type: Number,
      required: true,
      min: 0, // Hours can't be negative
    },
    minutes: {
      type: Number,
      required: true,
      min: 0,
      max: 59, // Minutes should be between 0 and 59
    },
  },
  educationLevel: {
    type: Number,
    enum: [1, 2, 3], // Define levels as required
    required: true,
  },
  Unit: {
    type: Number,
    min: 1, // Minimum value is 1
    max: 15, // Maximum value is 15
    required: true,
  },
  amountToPay: {
    type: Number,
    required: function() { return this.paid; }
  },
  paid: {
    type: Boolean,
    required: true,
    default: true, // Default to false (free quiz)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
