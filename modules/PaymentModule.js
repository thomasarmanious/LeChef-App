const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount must be positive']
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    method: {
        type: String,
        enum: ['credit_card', 'Mobile Wallet', 'Cash'], // Add more payment methods as needed
        required: true
    },
    contentType: {
        type: String,
        enum: ['Video', 'Quiz', 'Pdf'], // Type of content being paid for
        required: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'contentType',
        required: true
    },
    paymobOrderId: { // Paymob-specific field for storing Paymob order ID
        type: String,
    },
    paymobPaymentKey: { // Paymob-specific field for storing Paymob payment key
        type: String,
    },
    paymobTransactionId: { // Paymob-specific field for storing Paymob transaction ID
        type: String,
    },
    paymobResponse: { // Store the full response from Paymob
        type: mongoose.Schema.Types.Mixed,
    },
    paymentImageUrl: { // Add this field to store the Cloudinary URL
        type: String,
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    success: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true // This will automatically add createdAt and updatedAt fields
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
