const express = require('express');
const router=express.Router();
const { adminMiddleware } = require('../../Middleware/Admin');
const { userMiddleware } = require('../../Middleware/User');

const { createZoomMeeting } = require('../../Controllers/Admin/SessionsManagement/zoomService'); 
const { joinZoomMeeting } = require('../../Controllers/Admin/SessionsManagement/zoomService'); 
const { getStudentZoomSessions } = require('../../Controllers/Admin/SessionsManagement/zoomService'); 






router.post('/create-zoom-meeting', adminMiddleware,createZoomMeeting);

router.post('/join-zoom-meeting', userMiddleware,joinZoomMeeting);

router.get('/get-zoom-meetings', userMiddleware,getStudentZoomSessions);






module.exports=router;