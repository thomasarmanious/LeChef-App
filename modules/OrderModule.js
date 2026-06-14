const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  amount: { type: Number, required: true }, // Amount in cents
  currency: { type: String, required: true },
  merchantOrderId: { type: String, required: true },
  billingData: {
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String },
    phone_number: { type: String },
    apartment: { type: String },
    floor: { type: String },
    building: { type: String },
    street: { type: String },
    city: { type: String },
    country: { type: String },
    postal_code: { type: String }
  },
  authToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create and export the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;