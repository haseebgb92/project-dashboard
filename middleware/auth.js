const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      throw new Error('User not found');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new Error('Admin access required');
    }
    next();
  } catch (error) {
    res.status(403).json({ error: 'Access denied' });
  }
};

const isProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const user = await User.findById(req.user._id).populate('projects');
    
    const isMember = user.projects.some(project => 
      project._id.toString() === projectId
    );

    if (!isMember && req.user.role !== 'admin') {
      throw new Error('Project access denied');
    }
    
    next();
  } catch (error) {
    res.status(403).json({ error: 'Access denied' });
  }
};

module.exports = {
  auth,
  isAdmin,
  isProjectMember
};
