const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: [3, 'Username is too short'],
        maxlength: [20, 'Username is too long'],
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'Password is too short'],
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        apartment: { type: String, default: 'NA' },
        floor: { type: String, default: 'NA' },
        building: { type: String, default: 'NA' },
        street: { type: String, default: 'NA' },
        city: { type: String, default: 'NA' },
        state: { type: String, default: 'NA' },
        zip_code: { type: String, default: 'NA' },
        country: { type: String, default: 'NA' },
    },
    token: {
        type: String,
    },
    deviceToken: { 
    type: String, 
    default: null
    }, // Store the unique device identifier\

    image: {
        public_id: { type: String },
        url: { type: String },
    },
    educationLevel: {
        type: Number,
        enum: [1, 2, 3], // Levels like 1, 2, 3, etc.
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    paidContent: [
        {
            contentId: { 
                type: mongoose.Schema.Types.ObjectId, 
                required: true,
                refPath: 'paidContent.contentType', // Dynamically refer to the model based on contentType
            },
            contentType: { 
                type: String, 
                required: true, 
                enum: ['Video', 'Pdf', 'Quiz'] // Valid options for ref models
            },
            purchasedAt: { 
                type: Date, 
                default: Date.now // Purchase date
            },
        },
    ],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
