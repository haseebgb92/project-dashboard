const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['update', 'comment'],
    default: 'update'
  },
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  parentUpdate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Update'
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Update'
  }]
}, {
  timestamps: true
});

const Update = mongoose.model('Update', updateSchema);
module.exports = Update;
