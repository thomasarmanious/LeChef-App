const axios = require('axios');
require('dotenv').config();
const PaymentModule = require('../modules/PaymentModule'); // Import PaymentModule
const User = require('../modules/UsersModule'); // Import User model
const BASE_URL = 'https://accept.paymob.com/v1/intention/';

const paymobintention = {
  createPaymentRequest: async (amount, currency = 'EGP', integration_id) => {
    try {
      // Step 1: Set up headers with the secret key
      const headers = {
        Authorization: `Bearer ${process.env.PAYMOB_SECRET_KEY}`, // Use your secret key
        'Content-Type': 'application/json',
      };

      // Step 2: Define the body parameters for the payment request
      const body = {
        amount_cents: amount * 100, // Convert amount to cents
        currency,
        integration_id: process.env.PAYMOB_INTEGRATION_ID, // Your integration ID from Paymob
        description: "Payment for services", // Optional description
        items: [], // Optional items array
        billing_data: {
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          phone_number: "+201234567890",
          apartment: "NA",
          floor: "NA",
          building: "NA",
          street: "NA",
          city: "NA",
          state: "NA",
          country: "NA",
          zip_code: "NA",
        },
      };

      // Step 3: Make the POST request to the Intention API
      const response = await axios.post(BASE_URL, body, { headers });

      // Return the response from Paymob
      return response.data;
    } catch (error) {
      PaymentModule.logError('Error creating payment request:', error);
      throw error;
    }
  },
};


const paymobintention = require('./paymobintention');

(async () => {
  try {
    const amount = 500; // Amount in EGP
    const integrationId = process.env.PAYMOB_INTEGRATION_ID;
    const response = await paymobService.createPaymentRequest(amount, 'EGP', integrationId);
    console.log('Payment Request Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
})();


module.exports = paymobintention;
