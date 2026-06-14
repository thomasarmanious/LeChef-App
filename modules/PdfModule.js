const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, // Make title required
    },
    description: {
        type: String,
        required: true, // Make description required
    },
    url: {
        type: String,
        required: true, // Make URL required
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // Make teacher reference required
    },
    educationLevel: {
        type: Number,
        enum: [1, 2, 3], // Define levels as required
        required: true,
    },
    amountToPay: {
        type: Number,
        required: function() { return this.paid; }, // Required only if `paid` is true
    },
    paid: {
        type: Boolean,
        required: true,
        default: false, // Default to false (free PDF)
    },
    isLocked: {
        type: Boolean,
        default: true, // Default to locked
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const PDF = mongoose.model('Pdf', pdfSchema); 

module.exports = PDF;
