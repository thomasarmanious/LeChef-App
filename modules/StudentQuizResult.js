const mongoose = require('mongoose');

const studentQuizResultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        selectedOption: {
            type: String,
            required: true,
        },
    }],
    correctAnswers: {
        type: Number,
        default: 0,
    },
    wrongAnswers: {
        type: Number,
        default: 0,
    },
    totalQuestions: {
        type: Number,
        default: 0,
    },
    unansweredQuestions: {
        type: Number,
        default: 0,
    },
    score: {
        type: Number, // Number of correct answers
        required: true,
    },
    startTime: { // New field to track when the student started the quiz
        type: Date,
        required: true,
        default: Date.now, // When the quiz result is created, this field is set to the current time
    },
    completedAt: {
        type: Date,
        default: Date.now,
    },
});

const StudentQuizResult = mongoose.model('StudentQuizResult', studentQuizResultSchema);

module.exports = StudentQuizResult;