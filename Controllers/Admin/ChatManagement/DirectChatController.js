const DirectChatMessage = require('../../../modules/DirectChatModule');
const cloudinary = require('cloudinary').v2;
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../../../modules/UsersModule');
const path = require('path');
const multer = require('multer');
const upload = multer(); // This will handle multipart/form-data requests

exports.sendDirectMessage = [
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'documents', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const token = req.headers.token;
      if (!token) return res.status(401).json({ message: 'No token provided' });

      const decoded = jwt.verify(token, 'your_secret_key');
      const senderId = decoded.userId || decoded._id;

      const { receiverId } = req.params;
      const { content } = req.body;

      const receiver = await User.findById(receiverId);
      if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

      const sender = await User.findById(senderId);
      if (!sender) return res.status(403).json({ message: 'Unauthorized sender' });

      if (sender.role === 'user' && receiver.role === 'user') {
        return res.status(403).json({ message: 'Users cannot message each other' });
      }

      // Extract files from form-data
      const imageFile = req.files.image ? req.files.image[0] : null;
      const documents = req.files.documents || [];
      const audio = req.files.audio ? req.files.audio[0] : null;

      // Cloudinary upload helper
      const uploadToCloudinary = (file, folder, resourceType = 'image') => {
        return new Promise((resolve, reject) => {
          if (!file || !file.buffer) {
            return reject(new Error('File data is undefined'));
          }
          // Extract the original filename without extension
          const originalName = path.parse(file.originalname).name;

          const stream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: resourceType,
              public_id: originalName, // Use the original filename as the public_id
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.end(file.buffer);
        });
      };

      const uploadedImages = imageFile
        ? [await uploadToCloudinary(imageFile, 'LE CHEF/Direct Chat Uploads/Images', 'image')]
        : [];

      const uploadedDocuments = documents.length > 0
        ? await Promise.all(
            documents.map(file => uploadToCloudinary(file, 'LE CHEF/Direct Chat Uploads/Documents', 'raw'))
          )
        : [];

      const uploadedAudio = audio
        ? [await uploadToCloudinary(audio, 'LE CHEF/Direct Chat Uploads/Audios', 'video')]
        : [];

      // Check for an existing conversation between the sender and receiver
      let conversation = await DirectChatMessage.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      const newMessage = {
        sender: senderId,
        content,
        images: uploadedImages,
        documents: uploadedDocuments,
        audio: uploadedAudio.length > 0 ? uploadedAudio[0] : null,
        createdAt: Date.now(),
      };

      if (conversation) {
        // Append the new message to the existing conversation's messages array
        conversation.messages.push(newMessage);
      } else {
        // Create a new conversation document if one doesn't exist
        conversation = new DirectChatMessage({
          participants: [senderId, receiverId],
          messages: [newMessage],
        });
      }

      // Save the conversation
      await conversation.save();

      const { io } = require('../../../server');
      io.to([senderId, receiverId]).emit('direct message', conversation);

      res.status(201).json({ message: 'Message sent successfully', conversation: conversation.toObject() });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
];

exports.getDirectMessages= asyncHandler(async (req, res) => {
  try {
    const token = req.headers.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, 'your_secret_key');
    const userId = decoded.userId || decoded._id;

    const { chatRoomId } = req.params;

    // Verify that the user is a participant in the specified chat room
    const conversation = await DirectChatMessage.findOne({
      _id: chatRoomId,
      participants: userId,
    })
      .populate('messages.sender', 'username firstName lastName image')
      .select('messages')
      .lean();

    if (!conversation) {
      return res.status(404).json({ message: 'Chat room not found or access denied' });
    }

    // Filter messages to include only non-empty fields and sort by newest to oldest
    const messages = conversation.messages
      .map((msg) => {
        // Filter out empty fields in each message
        return Object.fromEntries(
          Object.entries(msg).filter(
            ([, value]) => value && (!(Array.isArray(value) || typeof value === 'object') || Object.keys(value).length > 0)
          )
        );
      })
      
      // Sort by newest to oldest
    messages.reverse(); 

    res.status(200).json({
      message: 'Conversation retrieved successfully',
      messages,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


exports.getAdminDirectChats = async (req, res) => {
  try {
    // Extract and verify token
    const token = req.headers.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, 'your_secret_key');
    const adminId = decoded._id;

    // Find all direct chat rooms where the admin is a participant
    const directChats = await DirectChatMessage.find({
      participants: adminId,
    }).populate('participants', 'username email image'); // Populate participant details if needed

    res.status(200).json({ message: 'Direct chats retrieved successfully', directChats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};