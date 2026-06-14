const axios = require('axios');
require('dotenv').config();
const PaymentModule = require('../modules/PaymentModule'); // Import PaymentModule
const User = require('../modules/UsersModule'); // Import User model
const BASE_URL = 'https://accept.paymob.com/v1/intention/';

const paymobService = {
  getAuthToken: async () => {
    try {
      const response = await axios.post(`${BASE_URL}/auth/tokens`, {
        api_key: process.env.PAYMOB_API_KEY,
      });
      return response.data.token;
    } catch (error) {
      PaymentModule.logError('Error getting auth token:', error);
      throw error;
    }
  },

  createOrder: async (authToken, amount) => {
    try {
      if (typeof amount !== 'number' || isNaN(amount)) {
        throw new Error('Amount must be a number');
      }

      const orderData = {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amount,
        currency: "EGP",
        items: [],
      };
      const response = await axios.post(`${BASE_URL}/ecommerce/orders`, orderData);
      return response.data;
    } catch (error) {
      PaymentModule.logError('Error creating order:', error);
      throw error;
    }
  },

  getPaymentKey: async (authToken, orderId, amount, userId) => {
    try {
      if (typeof amount !== 'number' || isNaN(amount)) {
        throw new Error('Amount must be a number');
      }

      // Fetch the user data based on userId
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Prepare billing data
      const billingData = {
        email: user.email,
        phone_number: user.phone || "NA",
        apartment: user.address?.apartment || "NA",
        floor: user.address?.floor || "NA",
        building: user.address?.building || "NA",
        street: user.address?.street || "NA",
        city: user.address?.city || "NA",
        country: user.address?.country || "NA",
        first_name: user.firstName,
        last_name: user.lastName,
        state: user.address?.state || "NA",
        zip_code: user.address?.zip_code || "NA",
      };

      // Prepare payment key request data
      const paymentKeyRequest = {
        auth_token: authToken,
        amount_cents: amount,
        currency: "EGP",
        order_id: orderId,
        billing_data: billingData,
        expiration: 3600, // Payment key expiration time
        integration_id: process.env.PAYMOB_INTEGRATION_ID, // Your integration ID from Paymob
        lock_order_when_paid: "false"

      };

      const response = await axios.post(`${BASE_URL}/acceptance/payment_keys`, paymentKeyRequest);
      return response.data.token;
    } catch (error) {
      PaymentModule.logError('Error getting payment key:', error);
      throw error;
    }
  },

  // Add the createPayment function
  createPayment: async (userId, amount) => {
    try {
      // Authenticate and get token
      const token = await paymobService.getAuthToken();

      // Create order and get orderId
      const orderResponse = await paymobService.createOrder(token, amount);
      const orderId = orderResponse.id;

      // Generate payment key with user billing data
      const paymentToken = await paymobService.getPaymentKey(token, orderId, amount, userId);

      return {
        orderId: orderId,
        token: paymentToken,
      };
    } catch (error) {
      PaymentModule.logError('Error creating payment:', error);
      throw error;
    }
  },

// Function to create credit card payment
createCreditCardPayment: async (userId, amount) => {
    try {
      // Step 1: Authenticate and get token
      const token = await paymobService.getAuthToken();

      // Step 2: Create the order
      const orderResponse = await paymobService.createOrder(token, amount);
      const orderId = orderResponse.id;

      // Step 3: Get payment key for credit card payment
      const paymentToken = await paymobService.getPaymentKey(token, orderId, amount, userId);

      // Return the payment URL
      const paymentURL = `https://accept.paymobsolutions.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
        
      return {
        orderId,
        paymentURL,
        paymentToken,
      };
    } catch (error) {
      PaymentModule.logError('Error creating credit card payment:', error);
      throw error;
    }
  }
};




module.exports = paymobService;
