  const mongoose = require('mongoose');

  const courseSchema = new mongoose.Schema(
    {
      title: {
        type: String,
        required: [true, 'عنوان الكورس مطلوب'],
        trim: true,
      },
      description: {
        type: String,
        trim: true,
        default: '',
      },
      instructor: {
        type: String,
        trim: true,
        default: '',
      },
      duration: {
        type: String, // e.g. "4 weeks", "20 hours"
        trim: true,
        default: '',
      },
      link: {
        type: String, // external URL or internal
        trim: true,
        default: '',
      },
      thumbnail: {
        type: String, // emoji or image url
        default: '📚',
      },
      // Targeting
      targetLevel: {
        type: String,
        enum: ['all', 'beginner', 'intermediate', 'advanced'],
        default: 'all',
      },
      targetGoal: {
        type: String,
        enum: ['all', 'job', 'skill', 'career'],
        default: 'all',
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      order: {
        type: Number,
        default: 0,
      },
    },
    { timestamps: true }
  );

  module.exports = mongoose.model('Course', courseSchema);
