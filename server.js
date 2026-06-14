const dotenv = require('dotenv');
dotenv.config(); // Load environment variables first
const express = require('express');
const dbConnection = require('./Config/database');
const morgan = require('morgan');
const cors =require("cors");
const http=require("http");
const cloudinary = require('./Util/Cloudinary');
const users = require('./modules/UsersModule')
const payment = require('./modules/PaymentModule');
const groupChat = require('./modules/GroupChatModule')
const directChat = require('./modules/DirectChatModule')
const group = require('./modules/GroupModule')
const pdf = require('./modules/PdfModule')
const quizzes = require('./modules/QuizzesModule')
const sessions = require('./modules/SessionsModule')
const videos = require('./modules/VideosModule')
const notes = require('./modules/NotesModule')
const quizresult = require('./modules/StudentQuizResult')
const Notification = require('./modules/NotificationsModule')
const noteroute = require('./Routes/AdminRoutes/ContentRoutes');
const pdfroute = require('./Routes/AdminRoutes/ContentRoutes');
const videoroute = require('./Routes/AdminRoutes/ContentRoutes');
const StudentManageRoutes = require('./Routes/AdminRoutes/StudentManageRoutes');
const loginroute = require('./Routes/UserRoutes/loginRoutes');
const quizroute = require('./Routes/AdminRoutes/QuizzesRoutes');
const submitquizroute = require('./Routes/UserRoutes/AnswerQuizRoute');
const chatroute = require('./Routes/AdminRoutes/ChatRoutes');
const paymentroute= require('./Routes/AdminRoutes/PaymentRoute');
const Sessionsroute = require('./Routes/AdminRoutes/SessionsRoutes');
const UserNotificationroute = require('./Routes/UserRoutes/UserNotifications');
const AdminNotificationroute = require('./Routes/AdminRoutes/AdminNotifications');







// Connect to the database
dbConnection();

const app = express();

// Middleware
app.use(express.json()); // Parse JSON requests



const { Server } = require('socket.io');


const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust this to allow specific origins
    methods: ['GET', 'POST']
  }
});
// Export io for use in other modules
module.exports = { app, server, io };


// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`Mode: ${process.env.NODE_ENV}`);
}

// Routes
app.use('/content', noteroute, pdfroute,videoroute);
app.use('/userManage', StudentManageRoutes);
app.use('/Users', loginroute);
app.use('/Quiz', quizroute);
app.use('/UserQuiz', submitquizroute);
app.use('/Chat', chatroute);
app.use('/Pay',paymentroute);
app.use('/zoom', Sessionsroute);
app.use('/Notifications',UserNotificationroute,AdminNotificationroute);


// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for joining a chat room
  socket.on('joinRoom', ({ groupId }) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined room ${groupId}`);
  });

  // Listen for messages in a group chat
  socket.on('groupMessage', ({ groupId, message }) => {
    io.to(groupId).emit('newGroupMessage', message);
  });

  // Listen for direct messages between students and the admin
  socket.on('directMessage', ({ senderId, adminId, message }) => {
    const roomId = [senderId, adminId].sort().join('_'); // Create a unique room for the pair
    socket.join(roomId);
    io.to(roomId).emit('newDirectMessage', message);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});





// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
