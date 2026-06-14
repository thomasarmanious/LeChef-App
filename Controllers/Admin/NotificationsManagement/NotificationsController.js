const jwt = require('jsonwebtoken');
const User = require('../../../modules/UsersModule');
const Notification = require('../../../modules/NotificationsModule'); 

exports.getStudentNotifications = async (req, res) => {
  try {
    const token = req.headers.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    // Decode the token to get user information
    const decodedToken = jwt.verify(token, 'your_secret_key');
    const userId = decodedToken._id;

    // Get the user by ID to fetch their education level
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const educationLevel = user.educationLevel;

    // Get notifications for this user based on their education level and type
    const notifications = await Notification.find({
      $and: [
        {
          type: { $in: ['note', 'video', 'pdf', 'quiz', 'meeting'] }, // Filter by type
        },
        {
          $or: [
            { level: { $exists: false } },  // Include notifications without a level field
            { level: educationLevel }  // Include notifications with the student's education level
          ]
        }
      ]
    }).sort({ createdAt: -1 });  // Sort notifications by the latest

    // Return the filtered notifications
    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'An error occurred while fetching notifications' });
  }
};



exports.getAllNotifications = async (req, res) => {
  try {
    const token = req.headers.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    // Decode the token to get user information
    const decodedToken = jwt.verify(token, 'your_secret_key');
    const userId = decodedToken._id;

    // Get the user by ID to check if the user is an admin
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all notifications for the admin (no filtering by level)
    const notifications = await Notification.find().sort({ createdAt: -1 }); // Sort notifications by latest

    // Return the notifications to the admin
    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications for admin:', error);
    res.status(500).json({ message: 'An error occurred while fetching notifications' });
  }
};

