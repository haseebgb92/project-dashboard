const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth, isAdmin, isProjectMember } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Project = require('../models/Project');
const Update = require('../models/Update');
const User = require('../models/User');

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private/Admin
router.post('/', [
  auth,
  isAdmin,
  [
    check('name', 'Project name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('startDate', 'Start date is required').not().isEmpty(),
    check('dueDate', 'Due date is required').not().isEmpty()
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, startDate, dueDate, members } = req.body;
    
    const project = new Project({
      name,
      description,
      startDate,
      dueDate,
      creator: req.user._id,
      members: members?.map(memberId => ({ user: memberId })) || []
    });

    await project.save();

    // Add project to members' projects array
    if (members?.length) {
      await User.updateMany(
        { _id: { $in: members } },
        { $push: { projects: project._id } }
      );
    }

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/projects
// @desc    Get all projects (admin) or user's projects (member)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.find()
        .populate('creator', 'name email')
        .populate('members.user', 'name email')
        .populate({
          path: 'updates',
          populate: { path: 'author', select: 'name email' }
        });
    } else {
      projects = await Project.find({
        'members.user': req.user._id
      })
        .populate('creator', 'name email')
        .populate('members.user', 'name email')
        .populate({
          path: 'updates',
          populate: { path: 'author', select: 'name email' }
        });
    }
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', [auth, isProjectMember], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('members.user', 'name email')
      .populate({
        path: 'updates',
        populate: { path: 'author', select: 'name email' }
      });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private/Admin
router.put('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const { name, description, startDate, dueDate, status, members } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update basic info
    if (name) project.name = name;
    if (description) project.description = description;
    if (startDate) project.startDate = startDate;
    if (dueDate) project.dueDate = dueDate;
    if (status) project.status = status;

    // Update members if provided
    if (members) {
      // Remove project from old members' projects array
      await User.updateMany(
        { _id: { $in: project.members.map(m => m.user) } },
        { $pull: { projects: project._id } }
      );

      // Add project to new members' projects array
      await User.updateMany(
        { _id: { $in: members } },
        { $push: { projects: project._id } }
      );

      project.members = members.map(memberId => ({ user: memberId }));
    }

    await project.save();
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/projects/:id/updates
// @desc    Add project update
// @access  Private
router.post('/:id/updates', [
  auth,
  isProjectMember,
  upload.array('files', 5),
  [
    check('content', 'Content is required').not().isEmpty()
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const update = new Update({
      project: project._id,
      author: req.user._id,
      content: req.body.content,
      attachments: req.files?.map(file => ({
        filename: file.originalname,
        path: file.path
      })) || []
    });

    await update.save();
    project.updates.push(update._id);
    await project.save();

    res.status(201).json(update);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private/Admin
router.delete('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Remove project from all members' projects array
    await User.updateMany(
      { _id: { $in: project.members.map(m => m.user) } },
      { $pull: { projects: project._id } }
    );

    // Delete all updates associated with the project
    await Update.deleteMany({ project: project._id });

    await project.remove();
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
