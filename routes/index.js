const express = require('express');

const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/projects', require('./projectRoutes'));
router.use('/sprints', require('./sprintRoutes'));
router.use('/tasks', require('./taskRoutes'));
router.use('/leaves', require('./leaveRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/roles', require('./roleRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/activity', require('./activityRoutes'));

module.exports = router;
