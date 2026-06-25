const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/role');
const ctrl = require('../controllers/activityController');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('activity.view'), ctrl.listActivity);

module.exports = router;
