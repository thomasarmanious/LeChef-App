const express = require('express');
const router=express.Router();

const { AddQuiz } = require('../../Controllers/Admin/ContentManagement/QuizzesController'); 
const { getAllQuizzes } = require('../../Controllers/Admin/ContentManagement/QuizzesController'); 
const { updateQuiz } = require('../../Controllers/Admin/ContentManagement/QuizzesController'); 
const { deleteQuiz } = require('../../Controllers/Admin/ContentManagement/QuizzesController'); 
const { getQuizById } = require('../../Controllers/Admin/ContentManagement/QuizzesController'); 
const { getUnitsWithExams } = require('../../Controllers/Admin/ContentManagement/QuizzesController'); 
const { getSubmittedQuizzes } = require('../../Controllers/Admin/ContentManagement/QuizzesController'); 
const { getSubmittedQuizIds } = require('../../Controllers/Admin/ContentManagement/QuizzesController'); 

const { authMiddleware } = require('../../Middleware/Auth');
const { userMiddleware } = require('../../Middleware/User');

const { ContentAccess } = require('../../Middleware/UserContentAccess');



const { adminMiddleware } = require('../../Middleware/Admin');









router.route('/AddQuiz').post(adminMiddleware,AddQuiz);
router.route('/ShowAllQuizzes').get(getAllQuizzes);
router.route('/Unit').get(getUnitsWithExams);
router.route('/GetSubmittedQuizzes/:quizId').get(authMiddleware,getSubmittedQuizzes);
router.route('/GetSubmittedQuizzesIds').get(authMiddleware,getSubmittedQuizIds);
router.route('/UpdateQuiz/:id').put(adminMiddleware,updateQuiz);
router.route('/DeleteQuiz/:id').delete(adminMiddleware,deleteQuiz);
router.route('/DeleteQuiz/:id').delete(adminMiddleware,deleteQuiz);
router.get('/:id',userMiddleware, ContentAccess('quiz'), getQuizById);



module.exports=router;
