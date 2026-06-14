const Quiz = require('../../../modules/QuizzesModule');
const StudentQuizResult = require('../../../modules/StudentQuizResult');
const mongoose = require('mongoose');

exports.submitQuiz = async (req, res) => {
    try {
        const { id } = req.params; // Quiz ID
        const { answers } = req.body;
        const studentId = req.user._id; // Extract student ID from token

        // Validate quizId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid quiz ID' });
        }

        // Find the quiz
        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Check if the student has already submitted this quiz
        const existingResult = await StudentQuizResult.findOne({
            student: studentId,
            quiz: id,
        });

        if (existingResult) {
            return res.status(400).json({ message: 'Quiz already submitted by this student' });
        }

        // Check if a quiz result already exists (i.e., the student started the quiz)
        let studentQuizResult = await StudentQuizResult.findOne({
            student: studentId,
            quiz: id,
        });

        if (!studentQuizResult) {
            // First time the student is submitting, set the start time to now
            studentQuizResult = new StudentQuizResult({
                student: new mongoose.Types.ObjectId(studentId),
                quiz: new mongoose.Types.ObjectId(id),
                startTime: Date.now(), // Record the start time when the student first starts the quiz
            });
        }

        // Calculate elapsed time since the quiz started
        const now = new Date();
        const startTime = new Date(studentQuizResult.startTime);
        const elapsedMinutes = (now - startTime) / 60000; // Convert milliseconds to minutes

        // Check if the elapsed time exceeds the quiz duration
        if (elapsedMinutes > quiz.duration) {
            return res.status(400).json({ message: 'Time is up! You have exceeded the quiz duration.' });
        }

        // Continue with calculating the results...
        const totalQuestions = quiz.questions.length;
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let unansweredQuestions = totalQuestions;

        // Array to store the status of each question
        const questionStatuses = [];

        // Convert answers array to a map for easier lookup
        const answerMap = new Map(answers.map(a => [a.questionId.toString(), a.selectedOption]));

        quiz.questions.forEach(question => {
            const selectedOptionIndex = answerMap.get(question._id.toString());  // Get the index of the selected option
            const correctAnswerIndex = question.options.indexOf(question.answer);

            let status = 'unanswered';  // Default status is 'unanswered'

            if (selectedOptionIndex === undefined) {
                // Unanswered question
                unansweredQuestions -= 1;
            } else {
                if (selectedOptionIndex === correctAnswerIndex) {
                    // Correct answer
                    correctAnswers += 1;
                    status = 'correct';
                } else {
                    // Wrong answer
                    wrongAnswers += 1;
                    status = 'wrong';
                }
            }

            // Push the status and question id to the array
            questionStatuses.push({
                questionId: question._id.toString(),
                status,
            });
        });

        // Calculate unansweredQuestions based on totalQuestions and counts
        unansweredQuestions = totalQuestions - (correctAnswers + wrongAnswers);

        // Update the student's quiz result
        studentQuizResult.answers = answers;
        studentQuizResult.correctAnswers = correctAnswers;
        studentQuizResult.wrongAnswers = wrongAnswers;
        studentQuizResult.totalQuestions = totalQuestions;
        studentQuizResult.unansweredQuestions = unansweredQuestions;
        studentQuizResult.score = correctAnswers;  // Number of correct answers
        // Store the completion time

        // Save the quiz result
        await studentQuizResult.save();

        // Return the response with question statuses
        res.status(201).json({
            message: 'Quiz submitted successfully',
            score: `${correctAnswers}/${totalQuestions}`,  // Format for response
            correctAnswers,
            wrongAnswers,
            totalQuestions,
            unansweredQuestions,
            questionStatuses,  // Include the statuses for each question
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
