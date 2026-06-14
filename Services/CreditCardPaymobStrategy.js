const express = require('express');
const router = express.Router();
const paymobService = require('../Services/paymobService'); // Adjust the path as needed

// Endpoint for processing credit card payments
router.post('/pay', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: 'User ID and amount are required' });
    }

    // Create payment
    const paymentResponse = await paymobService.createPayment(userId, amount);

    // Respond with payment details
    res.json({
      success: true,
      orderId: paymentResponse.orderId,
      paymentToken: paymentResponse.token,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

module.exports = router;