const Payment = require('../../../modules/PaymentModule');
const Video = require('../../../modules/VideosModule');
const Quiz = require('../../../modules/QuizzesModule');


const mongoose = require('mongoose');
const paymobService = require('../../../Services/paymobService');
const Order = require('../../../modules/OrderModule'); // Ensure the path to your Order model is correct
const jwt = require('jsonwebtoken');
const User = require('../../../modules/UsersModule');

exports.initiatePayment = async (req, res) => {
  try {
    const { amount, billingData } = req.body;

    // Convert amount to number
    const amountInCents = parseFloat(amount) * 100;
    if (isNaN(amountInCents)) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Step 1: Get auth token
    const authToken = await paymobService.getAuthToken();

    // Step 2: Create order
    const order = await paymobService.createOrder(authToken, amountInCents);

    // Save order to the database
    const newOrder = new Order({
      orderId: order.id,
      amount: parseFloat(amount),  // Store the amount in EGP, not cents
      currency: "EGP",
      billingData: billingData,
      authToken: authToken
    });

    await newOrder.save(); // Save order to the database
    console.log('Order saved:', newOrder);

    // Step 3: Get payment key
    const paymentKey = await paymobService.getPaymentKey(authToken, order.id, amountInCents, billingData);

    res.json({ paymentKey });
  } catch (error) {
    console.error('Payment initiation failed:', error); // Log error details
    res.status(500).json({ message: 'Payment initiation failed', error: error.message });
  }

};


exports.initiateCreditCardPayment = async (req, res) => {
  try {
    // Extract and verify token
    const token = req.headers.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    // Verify and decode the token
    const decodedToken = jwt.verify(token, 'your_secret_key');  // Ensure this matches your .env secret
    const userId = decodedToken._id;  // Extract the user ID from the decoded token

    // Validate input
    const { contentId } = req.body;
    if (!userId || !contentId) {
      return res.status(400).json({ message: 'User ID and content ID are required' });
    }

    // Get the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Determine content type from contentId and retrieve amountToPay
    let amountToPay;
    let contentType;
    const video = await Video.findById(contentId); // Check for video
    if (video) {
      amountToPay = video.amountToPay; // Get amount to pay from video
      contentType = 'Video';
    } else {
      const quiz = await Quiz.findById(contentId); // Check for quiz
      if (quiz) {
        amountToPay = quiz.amountToPay; // Get amount to pay from quiz
        contentType = 'Quiz';
      } else {
        const pdf = await PDF.findById(contentId); // Check for PDF
        if (pdf) {
          amountToPay = pdf.amountToPay; // Get amount to pay from PDF
          contentType = 'PDF';
        }
      }
    }

    // If content not found in any of the models
    if (!contentType) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Convert amount to cents (for Paymob)
    const amountInCents = parseFloat(amountToPay) * 100;
    if (isNaN(amountInCents)) {
      return res.status(400).json({ message: 'Invalid amount to pay' });
    }

    // Step 1: Create credit card payment
    const paymentResult = await paymobService.createCreditCardPayment(userId, amountInCents);

    // Handle payment result
    const transactionId = paymentResult.transactionId || paymentResult.data?.transaction_id || paymentResult?.transaction_id;

    // Step 2: Save payment details in the database
    const payment = new Payment({
      user: userId,
      amount: parseFloat(amountToPay),  // Store the amount in EGP, not cents
      status: 'pending',  // Initial status is pending
      method: 'credit_card',
      contentType: contentType, // Dynamically set content type
      contentId: contentId,     // Use contentId from request body
      paymobOrderId: paymentResult.orderId,
      paymobPaymentKey: paymentResult.paymentToken,
      paymobTransactionId: paymentResult.transactionId,  // Store Paymob transaction ID
      paymobResponse: paymentResult  // Store the full response from Paymob for reference
    });

    await payment.save();

    // Return the payment URL for frontend to redirect to (if necessary)
    res.json({ paymentURL: paymentResult.paymentURL, status: payment.status });
  } catch (error) {
    console.error('Credit card payment initiation failed:', error);
    res.status(500).json({ message: 'Payment initiation failed', error: error.message });
  }
};



exports.handlePaymobCallback = async (req, res) => {
  try {
      console.log('Received callback:', req.method, req.body);

      // Extract order ID based on the request method
      const orderId = req.method === 'POST' ? req.body.obj?.order?.id : req.query.order;

      console.log("Received order ID:", orderId);

      // Validate order ID
      if (!orderId) {
          return res.status(400).json({ message: 'Order ID is missing' });
      }

      // Find the payment record based on order ID
      const payment = await Payment.findOne({ paymobOrderId: orderId });

      if (!payment) {
          return res.status(404).json({ message: 'Payment not found' });
      }

      // Extract payment data based on the request method
      const paymentData = req.method === 'POST' ? req.body.obj : req.query;

      // Convert string values to boolean
      const success = paymentData.success === 'true';
      const is_voided = paymentData.is_voided === 'true';
      const pending = paymentData.pending === 'true';

      // Log the values to debug
      console.log('Payment Data:', { success, is_voided, pending });

      let message;

      // Determine the payment status based on the logic described
      if (success) {
          payment.status = 'success'; // Transaction is successful
          message = 'Payment completed successfully.';

          // Fetch the user related to the payment
          const user = await User.findById(payment.user); // Assuming payment.user contains the user ID
          
          if (user) {
              // Push the paid content to the user's document
              user.paidContent.push({
                  contentId: payment.contentId, // Assume this field exists in your payment model
                  contentType: payment.contentType, // This should also exist
                  purchasedAt: new Date(), // Record the purchase date
              });
              
              await user.save(); // Save the updated user document
          } else {
              console.error('User not found for payment:', payment.user);
          }
      } else if (is_voided) {
          payment.status = 'failed'; // Transaction was voided
          message = 'Payment was voided.';
      } else if (pending) {
          payment.status = 'pending'; // Transaction is pending
          message = 'Payment is pending.';
      } else {
          payment.status = 'failed'; // Default to failed if not successful, voided, or pending
          message = 'Payment failed.';
      }

      // Save the payment data along with the status
      payment.success = success;

      console.log('Updated Payment Status:', payment.status); // Log the updated status

      await payment.save();

      // Return the specific message based on the status
      return res.status(200).json({ message });
  } catch (error) {
      console.error('Paymob callback handling failed:', error);
      return res.status(500).json({ message: 'Payment status update failed', error: error.message });
  }
};












