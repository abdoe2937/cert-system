const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'موضوع الشكوى مطلوب'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'نص الشكوى مطلوب'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved'],
      default: 'new',
    },
    adminReply: {
      type: String,
      default: '',
    },
    repliedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
