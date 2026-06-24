const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/role');
const ctrl = require('../controllers/sprintController');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  requirePermission('sprint.manage'),
  [
    body('project').isMongoId().withMessage('project (ObjectId) requis.'),
    body('name').isString().trim().notEmpty().withMessage('Nom requis.'),
    body('startDate').isISO8601().withMessage('startDate (date ISO) requise.'),
    body('endDate').isISO8601().withMessage('endDate (date ISO) requise.'),
    body('goal').optional().isString(),
  ],
  validate,
  ctrl.createSprint
);

router.get('/:id', param('id').isMongoId(), validate, ctrl.getSprint);
router.get('/:id/capacity', param('id').isMongoId(), validate, ctrl.getCapacity);

router.patch(
  '/:id',
  requirePermission('sprint.manage'),
  [param('id').isMongoId(), body('startDate').optional().isISO8601(), body('endDate').optional().isISO8601()],
  validate,
  ctrl.updateSprint
);

router.patch('/:id/start', requirePermission('sprint.manage'), param('id').isMongoId(), validate, ctrl.startSprint);
router.patch('/:id/complete', requirePermission('sprint.manage'), param('id').isMongoId(), validate, ctrl.completeSprint);

module.exports = router;
