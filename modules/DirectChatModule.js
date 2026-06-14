const mongoose = require('mongoose');
const timezonePlugin = require('../timezonePlugin');


const directChatMessageSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  messages: [
    {
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      content: {
        type: String,
      },
      images: [String],
      documents: [String],
      audio: {
        data: Buffer,
        contentType: String,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, { timestamps: true });

directChatMessageSchema.plugin(timezonePlugin, { timezone: 'Africa/Cairo' });


const DirectChatMessage = mongoose.model('DirectChatMessage', directChatMessageSchema);

module.exports = DirectChatMessage;
