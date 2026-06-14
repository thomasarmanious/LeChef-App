const Group = require('../../../modules/GroupModule');
const GroupChatMessage = require('../../../modules/GroupChatModule');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../../modules/UsersModule');



//CREATE GROUPS
exports.createGroup = async (req, res) => {
    try {
      // Extract and verify token
      const token = req.headers.token;
      if (!token) return res.status(401).json({ message: 'No token provided' });
      
      const decoded = jwt.verify(token, 'your_secret_key');
      const adminId = decoded._id;
  
      const { title, description } = req.body;
  
      const newGroup = new Group({
        title,
        description,
        members: [adminId], // Admin is the first member
        createdBy: adminId,
      });
  
      await newGroup.save();
  
      res.status(201).json({ message: 'Group created successfully', group: newGroup });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  //GET ADMIN GROUPS
  
  exports.getAdminGroups = async (req, res) => {
    try {
      // Extract and verify token
      const token = req.headers.token;
      if (!token) return res.status(401).json({ message: 'No token provided' });
      
      const decoded = jwt.verify(token, 'your_secret_key');
      const adminId = decoded._id;

    // Find all groups where the admin is a member
    const groups = await Group.find({ members: adminId });
  
      res.status(200).json({ message: 'Groups retrieved successfully', groups });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  // UPDATE GROUP
  exports.updateGroup = async (req, res) => {
    try {
      // Extract and verify token
      const token = req.headers.token;
      if (!token) return res.status(401).json({ message: 'No token provided' });
      
      const decoded = jwt.verify(token, 'your_secret_key');
      const adminId = decoded._id;
  
      const { groupId } = req.params;
      const { title, description } = req.body;
  
      // Find the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
  
      // Check if the user is the admin who created the group
      if (group.createdBy.toString() !== adminId) {
        return res.status(403).json({ message: 'You are not authorized to update this group' });
      }
  
      // Update group details
      if (title) group.title = title;
      if (description) group.description = description;
  
      // Save the updated group
      await group.save();
  
      res.status(200).json({ message: 'Group updated successfully', group });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  
  // DELETE GROUP
  exports.deleteGroup = async (req, res) => {
    try {
      // Extract and verify token
      const token = req.headers.token;
      if (!token) return res.status(401).json({ message: 'No token provided' });
      
      const decoded = jwt.verify(token, 'your_secret_key');
      const adminId = decoded._id;
  
      const { groupId } = req.params;
  
      // Find the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
  
      // Check if the user is the admin who created the group
      if (group.createdBy.toString() !== adminId) {
        return res.status(403).json({ message: 'You are not authorized to delete this group' });
      }
  
      // Delete the group
      await Group.findByIdAndDelete(groupId);  
    
  
      res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  //ADD STUDENTS TO GROUP
  exports.addStudentToGroup = async (req, res) => {
    try {
        const token = req.headers.token;
        if (!token) return res.status(401).json({ message: 'No token provided' });

        const decoded = jwt.verify(token, 'your_secret_key');
        const adminId = decoded._id;

        const { groupId } = req.params;
        const { studentIds } = req.body;

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'Provide one or more student IDs' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const successfullyAdded = [];
        const failedToAdd = [];

        for (const studentId of studentIds) {
            try {
                if (!mongoose.isValidObjectId(studentId)) {
                    failedToAdd.push({ studentId, reason: 'Invalid student ID' });
                    continue;
                }

                const student = await User.findById(studentId);
                if (!student) {
                    failedToAdd.push({ studentId, reason: 'Student not found' });
                    continue;
                }

                if (group.members.some(member => member.equals(student._id))) {
                    failedToAdd.push({ studentId, reason: 'Already a member of this group' });
                    continue;
                }

                group.members.push(student._id);
                successfullyAdded.push(studentId);
            } catch (innerError) {
                console.error(innerError);
                failedToAdd.push({ studentId, reason: innerError.message || 'Error processing student' });
            }
        }

        await group.save();

        res.status(200).json({
            message: 'Students processed successfully',
            successfullyAdded,
            failedToAdd,
            group,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


  
  //REMOVE STUDENTS FROM GROUP
  exports.removeStudentsFromGroup = async (req, res) => {
    try {
      // Extract and verify token
      const token = req.headers.token;
      if (!token) return res.status(401).json({ message: 'No token provided' });
  
      const { groupId } = req.params;
      const { studentIds } = req.body; // Expect an array of student IDs
  
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: 'Provide one or more student IDs' });
      }
  
      // Find the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
  
      const successfullyRemoved = [];
      const failedToRemove = [];
  
      for (const studentId of studentIds) {
        // Check if the student is a member of the group
        if (!group.members.includes(studentId)) {
          failedToRemove.push({ studentId, reason: 'Not a member of the group' });
          continue;
        }
  
        // Remove the student from the group
        group.members = group.members.filter(member => member.toString() !== studentId);
        successfullyRemoved.push(studentId);
      }
  
      await group.save();
  
      res.status(200).json({
        message: 'Students processed successfully',
        successfullyRemoved,
        failedToRemove,
        group,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };


  // GET ALL STUDENTS OF A GROUP
exports.getGroupMembers = async (req, res) => {
  try {
    // Extract and verify token (if needed for authentication)
    const token = req.headers.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const { groupId } = req.params;

    // Find the group and populate the members' details with username and image
    const group = await Group.findById(groupId).populate('members', 'username image');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Return the members with selected attributes
    res.status(200).json({
      message: 'Group members retrieved successfully',
      members: group.members,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};