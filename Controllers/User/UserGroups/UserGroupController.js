const Group = require('../../../modules/GroupModule');
const GroupChatMessage = require('../../../modules/GroupChatModule');

const jwt = require('jsonwebtoken');
const User = require('../../../modules/UsersModule');


//GET STUDENTS GROUPS
exports.getStudentGroups = async (req, res) => {
    try {
      // Extract and verify token
      const token = req.headers.token;
      if (!token) return res.status(401).json({ message: 'No token provided' });
      
      const decoded = jwt.verify(token, 'your_secret_key');
      const studentId = decoded._id;
  
      // Find all groups where the student is a member
      const groups = await Group.find({ members: studentId });
  
      res.status(200).json({ message: 'Groups retrieved successfully', groups });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };