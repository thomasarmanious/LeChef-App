const express = require('express');
const router=express.Router();

const { submitQuiz } = require('../../Controllers/User/UserQuiz/QuizAnswers'); 



const { userMiddleware } = require('../../Middleware/User');











router.route('/SubmitQuiz/:id').post(userMiddleware,submitQuiz);


module.exports=router;