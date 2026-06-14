
const Group = require('../../../modules/GroupModule');
const GroupChatMessage = require('../../../modules/GroupChatModule');
const cloudinary = require('cloudinary').v2;
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../../../modules/UsersModule');
const multer = require('multer');
const path = require('path');
const upload = multer(); // Set up multer for handling multipart form-data

exports.sendGroupMessage = [
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 10 },
    { name: 'audio', maxCount: 1 },
    { name: 'voiceNote', maxCount: 1 },  // New field for voice notes
  ]),
  async (req, res) => {
    try {
      const token = req.headers.token;
      if (!token) return res.status(401).json({ message: 'No token provided' });

      const decoded = jwt.verify(token, 'your_secret_key');
      const senderId = decoded.userId || decoded._id;

      const { groupId } = req.params;
      const { content } = req.body;

      const sender = await User.findById(senderId);
      if (!sender) return res.status(403).json({ message: 'Unauthorized sender' });

      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }

      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      if (!group.members.includes(senderId)) {
        return res.status(403).json({ message: 'You are not a member of this group' });
      }

      const images = req.files.images || [];
      const documents = req.files.documents || [];
      const audio = req.files.audio ? req.files.audio[0] : null;
      const voiceNote = req.files.voiceNote ? req.files.voiceNote[0] : null;

      const uploadToCloudinary = (file, folder, resourceType = 'image') => {
        return new Promise((resolve, reject) => {
          if (!file || !file.buffer) {
            return reject(new Error('File data is undefined'));
          }
          const originalName = file.originalname.split('.')[0];
          const stream = cloudinary.uploader.upload_stream(
            { folder, public_id: originalName, resource_type: resourceType },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.end(file.buffer);
        });
      };

      // Upload images, documents, audio, and voice notes
      const uploadedImages = await Promise.all(images.map(file =>
        uploadToCloudinary(file, 'LE CHEF/Chat Uploads/Images', 'image')
      ));

      const uploadedDocuments = await Promise.all(documents.map(file =>
        uploadToCloudinary(file, 'LE CHEF/Chat Uploads/Documents', 'raw')
      ));

      const uploadedAudio = audio ? await uploadToCloudinary(audio, 'LE CHEF/Chat Uploads/Audios', 'video') : null;

      const uploadedVoiceNote = voiceNote 
        ? await uploadToCloudinary(voiceNote, 'LE CHEF/Chat Uploads/Voice Notes', 'video') 
        : null;

      let conversation = await GroupChatMessage.findOne({ group: groupId });
      const newMessage = {
        sender: senderId,
        content,
        images: uploadedImages,
        documents: uploadedDocuments,
        audio: uploadedAudio ? [uploadedAudio] : [],
        voiceNotes: uploadedVoiceNote ? [uploadedVoiceNote] : [],  // Store voice note URL
        createdAt: Date.now(),
      };

      if (conversation) {
        conversation.messages.push(newMessage);
      } else {
        conversation = new GroupChatMessage({
          group: groupId,
          messages: [newMessage],
        });
      }

      await conversation.save();

      // Update the lastMessage field in the Group model
      const lastMessage = {
        sender: senderId,
        content,
        images: uploadedImages,
        documents: uploadedDocuments,
        audio: uploadedAudio ? [uploadedAudio] : [],
        voiceNotes: uploadedVoiceNote ? [uploadedVoiceNote] : [],  // Update the lastMessage with the voice note
        createdAt: Date.now(),
      };

      await Group.findByIdAndUpdate(
        groupId,
        { lastMessage },
        { new: true }
      );

      // Emit the message to the group room via Socket.IO
      const { io } = require('../../../server');
      io.to(`group_${groupId}`).emit('group message', conversation);

      res.status(201).json({ message: 'Message sent successfully', conversation: conversation.toObject() });
    } catch (error) {
      console.error('Error in sendGroupMessage:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },
];




exports.getGroupMessages = asyncHandler(async (req, res) => {
  try {
    const token = req.headers.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, 'your_secret_key');
    const userId = decoded.userId || decoded._id;
    const { groupId } = req.params;

    // Check if the user is a member of the group
    const user = await User.findById(userId);
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(userId)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Retrieve group chat messages, populate sender information, and filter out empty fields
    const conversation = await GroupChatMessage.findOne({ group: groupId })
      .populate('messages.sender', 'username firstName lastName image')
      .select('messages')
      .lean();

    if (!conversation) return res.status(404).json({ message: 'No messages found for this group' });

    // Filter messages to include only non-empty fields and sort by newest to oldest
    const messages = conversation.messages
      .map((msg) =>
        Object.fromEntries(
          Object.entries(msg).filter(
            ([, value]) => value && (!(Array.isArray(value) || typeof value === 'object') || Object.keys(value).length > 0)
          )
        )
      )
      .reverse(); // Reverse to get newest to oldest

    res.status(200).json({
      message: 'Messages retrieved successfully',
      messages,
    });
  } catch (error) {
    console.error('Error in getGroupMessagesByGroupId:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});