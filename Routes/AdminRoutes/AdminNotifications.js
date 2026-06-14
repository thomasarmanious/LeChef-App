const express = require('express');
const router=express.Router();

const { adminMiddleware } = require('../../Middleware/Admin');

const { getAllNotifications } = require('../../Controllers/Admin/NotificationsManagement/NotificationsController');



router.route('/AdminNotification').get(adminMiddleware,getAllNotifications);

module.exports=router;