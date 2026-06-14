const express = require('express');
const router=express.Router();
const upload = require('../../uploads/uploads');
const { initiatePayment } = require('../../Controllers/Admin/PaymentManager/Credit_Card_Controller.js'); 
const { initiateCreditCardPayment } = require('../../Controllers/Admin/PaymentManager/Credit_Card_Controller.js'); 
const { handlePaymobCallback } = require('../../Controllers/Admin/PaymentManager/Credit_Card_Controller.js'); 


const { initiateEWalletPayment } = require('../../Controllers/Admin/PaymentManager/E_Wallet_Controller'); 
const { userMiddleware } = require('../../Middleware/User');
const { adminMiddleware } = require('../../Middleware/Admin');

const { initiateCashPayment } = require('../../Controllers/Admin/PaymentManager/Cash_Controller.js'); 

const { getPendingPayments } = require('../../Controllers/Admin/PaymentManager/PaymentController'); 
const { acceptPaymentRequest } = require('../../Controllers/Admin/PaymentManager/PaymentController'); 
const { rejectPaymentRequest } = require('../../Controllers/Admin/PaymentManager/PaymentController'); 



router.route('/paymob/payment').post(initiatePayment);
router.route('/paymob/creditCard').post(initiateCreditCardPayment);
router.route('/paymob/callback').post(handlePaymobCallback);
router.route('/paymob/callback').get(handlePaymobCallback);


router
.route('/WalletRequest/:contentId')
.post(userMiddleware, upload.single('paymentImage'), initiateEWalletPayment);


router.route('/CashRequest/:contentId').post(initiateCashPayment);

router.route('/PendingRequests').get(adminMiddleware,getPendingPayments);
router.route('/Requests/:paymentId/accept').post(adminMiddleware,acceptPaymentRequest);
router.route('/Requests/:paymentId/reject').post(adminMiddleware,rejectPaymentRequest);




module.exports=router;