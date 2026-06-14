const Quiz = require('../../../modules/QuizzesModule');
const StudentQuizResult = require('../../../modules/StudentQuizResult.js'); 
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // Assuming you're using JWT for tokens
const User = require('../../../modules/UsersModule'); // Adjust the path as necessary
const Notification = require('../../../modules/NotificationsModule'); 

exports.AddQuiz = async (req, res) => {
    try {
        const { title, questions, hours, minutes, amountToPay, paid, educationLevel, Unit } = req.body;
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({ error: 'Access Denied. No token provided.' });
        }

        const decoded = jwt.verify(token, 'your_secret_key');  // Replace with your actual secret key
        const teacherId = decoded._id;  // Assuming '_id' contains the teacher's ID

        // Validate required fields
        if (!title || !questions || !educationLevel || !Unit) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // Ensure `paid` is boolean
        const isPaid = paid === true;

        // Create the quiz
        const quiz = new Quiz({
            title,
            questions: questions.map(q => ({
                question: q.question,
                options: q.options,
                answer: q.answer
            })),
            teacher: teacherId,
            duration: {
                hours: Number(hours),
                minutes: Number(minutes),
            },
            amountToPay: isPaid ? Number(amountToPay) : undefined,
            paid: isPaid,
            isLocked: isPaid, // If paid, lock the quiz
            educationLevel: Number(educationLevel),
            Unit: Number(Unit),
        });

        await quiz.save();

        // Create the notification
        await Notification.create({
            message: `You have a new quiz: ${quiz.title}!`,  // Include the quiz title in the message
            type: 'quiz',
            level: educationLevel,
        });

        res.status(201).json({ message: "Quiz created successfully", quiz });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};







exports.getAllQuizzes = async (req, res) => {
    try {
        const token = req.headers.token; // Extract the token from the headers
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token is missing' });
        }

        const decoded = jwt.verify(token, 'your_secret_key'); // Replace 'your_secret_key' with your actual secret key
        const userId = decoded._id; // Extract user ID from the token

        // Find the user to check their role and details
        const user = await User.findById(userId).populate('paidContent.contentId');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the user is an admin
        if (user.role === 'admin') {
            // If the user is an admin, return all quizzes
            const allQuizzes = await Quiz.find({}).populate('teacher', 'username email');
            return res.status(200).json({
                quizzes: allQuizzes,
                message: 'All quizzes returned for admin.',
            });
        }

        // For non-admin users, filter quizzes based on education level
        const userEducationLevel = user.educationLevel; // Get the user's education level

        // Fetch quizzes that match the user's education level
        const quizzes = await Quiz.find({ educationLevel: userEducationLevel }).populate('teacher', 'username email');

        // Filter paid content to include only quiz-type IDs that match education level
        const quizPaidContentIds = user.paidContent
            .filter(content => content.contentType === 'Quiz' && content.contentId.educationLevel === userEducationLevel)
            .map(content => content.contentId._id);

        // Structure the response with filtered quizzes and quiz-type paid content IDs
        res.status(200).json({
            quizzes,
            quizPaidContentIds,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};





exports.updateQuiz = async (req, res) => {
    try {
        const updateData = {};
        
        // Only add fields to updateData if they are provided in the request body
        if (req.body.title) updateData.title = req.body.title;
        if (req.body.questions) {
            updateData.questions = Array.isArray(req.body.questions) 
                ? req.body.questions.map(q => ({
                    question: q.question,
                    options: q.options,
                    answer: q.answer
                }))
                : [];
        }
        if (req.body.teacher) updateData.teacher = new mongoose.Types.ObjectId(req.body.teacher);
        if (req.body.hours) updateData.duration = { hours: parseInt(req.body.hours) };
        if (req.body.minutes) updateData.duration = { ...updateData.duration, minutes: parseInt(req.body.minutes) };
        if (req.body.amountToPay) updateData.amountToPay = parseFloat(req.body.amountToPay);
        if (req.body.paid !== undefined) updateData.paid = req.body.paid;
        if (req.body.educationLevel) updateData.educationLevel = parseInt(req.body.educationLevel);
        if (req.body.Unit) updateData.Unit = parseInt(req.body.Unit);
        updateData.updatedAt = Date.now();

        const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!updatedQuiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        res.status(200).json(updatedQuiz);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};




exports.deleteQuiz = async (req, res) => {
    try {
        const deletedQuiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!deletedQuiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


exports.getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('teacher', 'username email');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json(quiz);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};





exports.getUnitsWithExams = async (req, res) => {
    try {
        // Find all distinct units that have at least one exam
        const unitsWithExams = await Quiz.distinct("Unit");

        // Map the units to the desired format if needed
        const unitNames = unitsWithExams.map(unit => `Unit ${unit}`);

        // Respond with the unit names
        res.status(200).json({ units: unitNames });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getSubmittedQuizzes = async (req, res) => {
    try {
        const studentId = req.user._id; // Extract student ID from token
        const { quizId } = req.params; // Get quizId from the request parameters

        // Ensure the quizId is provided and valid
        if (!quizId) {
            return res.status(400).json({ error: "Quiz ID is required" });
        }

        // Retrieve all quiz results submitted by the student for the specific quiz
        const submittedQuizzes = await StudentQuizResult.find({
            student: studentId,
            'quiz': quizId // Only select results where the quiz matches the quizId in the params
        })
            .populate('quiz', 'title questions') // Populate quiz details
            .lean(); // Convert to plain objects for easier manipulation

        // Check if any quizzes were found
        if (submittedQuizzes.length === 0) {
            return res.status(404).json({ error: "No submissions found for this quiz" });
        }

        const formattedQuizzes = submittedQuizzes.map((result) => {
            const { quiz, answers, correctAnswers, wrongAnswers, unansweredQuestions, totalQuestions } = result;

            const formattedQuestions = quiz.questions.map((question) => {
                // Map options to numbers (0, 1, 2, 3)
                const optionsWithNumbers = question.options.map((option, i) => ({
                    number: i , // Start numbering from 1
                    text: option,
                }));
            
                // Find the submitted answer for this question
                const submittedAnswer = answers.find((a) => {
                    return a.questionId.toString() === question._id.toString();
                });
            
                const selectedNumber = submittedAnswer
                ? Math.min(Math.max(parseInt(submittedAnswer.selectedOption), 0), 3) // Ensure it's between 0 and 3
                : -1; // Use -1 for unanswered questions
            
                // Determine the correct answer number
                const correctAnswerIndex = question.options.indexOf(question.answer);
                const correctAnswerNumber = correctAnswerIndex !== -1
                    ? correctAnswerIndex + 1 // Convert index to number (starting from 1)
                    : null;
            
                // Determine the status of the answer
                let status = 'unanswered';
                if (submittedAnswer) {
                    status =
                        parseInt(submittedAnswer.selectedOption) === correctAnswerIndex
                            ? 'correct'
                            : 'wrong';
                }
            
                return {
                    questionId: question._id, // Include the question ID
                    question: question.question,
                    options: optionsWithNumbers, // Use numbers instead of letters
                    selectedNumber, // Use number instead of letter
                    correctAnswerNumber, // Use number instead of letter
                    status,
                };
            });

            return {
                quizId: quiz._id,
                title: quiz.title,
                totalQuestions,
                correctAnswers,
                wrongAnswers,
                unansweredQuestions,
                questions: formattedQuestions,
            };
        });

        res.status(200).json({
            message: 'Retrieved submitted quizzes successfully',
            quizzes: formattedQuizzes,
        });
    } catch (error) {
        console.error('Error retrieving quizzes:', error); // Debug log
        res.status(400).json({ error: error.message });
    }
};


exports.getSubmittedQuizIds = async (req, res) => {
    try {
        const studentId = req.user._id; // Extract student ID from the token
        
        // Retrieve all quiz results submitted by the student
        const submittedQuizIds = await StudentQuizResult.find({ student: studentId })
            .distinct('quiz'); // Get distinct quiz IDs

        // Check if any quizzes were found
        if (submittedQuizIds.length === 0) {
            return res.status(404).json({ error: "No submitted quizzes found" });
        }

        res.status(200).json({
            message: 'Retrieved submitted quiz IDs successfully',
            quizIds: submittedQuizIds,
        });
    } catch (error) {
        console.error('Error retrieving quiz IDs:', error); // Debug log
        res.status(400).json({ error: error.message });
    }
};
