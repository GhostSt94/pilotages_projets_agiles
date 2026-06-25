const express = require('express');
const { param } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const ctrl = require('../controllers/notificationController');

const router = express.Router();

router.use(authenticate);

router.get('/', ctrl.listNotifications);
router.get('/count', ctrl.getUnreadCount);
router.patch('/read-all', ctrl.markAllRead);
router.patch('/:id/read', param('id').isMongoId(), validate, ctrl.markRead);

module.exports = router;
