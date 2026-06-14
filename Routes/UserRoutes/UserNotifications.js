const express = require('express');
const router=express.Router();

const { userMiddleware } = require('../../Middleware/User');


const { getStudentNotifications } = require('../../Controllers/Admin/NotificationsManagement/NotificationsController');



router.route('/UserNotification').get(userMiddleware,getStudentNotifications);

module.exports=router;