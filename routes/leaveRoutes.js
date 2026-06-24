const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/role');
const ctrl = require('../controllers/leaveController');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('startDate').isISO8601().withMessage('startDate (date ISO) requise.'),
    body('endDate').isISO8601().withMessage('endDate (date ISO) requise.'),
    body('type').optional().isIn(['vacation', 'sick', 'personal', 'other']),
    body('reason').optional().isString(),
    body('user').optional().isMongoId(),
  ],
  validate,
  ctrl.createLeave
);

router.get('/', ctrl.listLeaves);

router.patch('/:id/approve', requirePermission('leave.review'), param('id').isMongoId(), validate, ctrl.approveLeave);
router.patch('/:id/reject', requirePermission('leave.review'), param('id').isMongoId(), validate, ctrl.rejectLeave);

module.exports = router;
