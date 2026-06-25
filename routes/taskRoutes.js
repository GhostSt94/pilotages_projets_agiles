const express = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { imageUpload } = require('../middlewares/upload');
const ctrl = require('../controllers/taskController');

const router = express.Router();

const STATUSES = ['todo', 'in_progress', 'in_review', 'done'];

router.use(authenticate);

router.get(
  '/',
  [query('project').optional().isMongoId(), query('status').optional().isIn(STATUSES)],
  validate,
  ctrl.listTasks
);

router.get('/:id', param('id').isMongoId(), validate, ctrl.getTask);

router.post(
  '/',
  [
    body('project').isMongoId().withMessage('project (ObjectId) requis.'),
    body('title').isString().trim().notEmpty().withMessage('Titre requis.'),
    body('sprint').optional({ nullable: true }).isMongoId(),
    body('estimate').optional().isFloat({ min: 0 }),
    body('type').optional().isIn(['feature', 'bug', 'tech']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('status').optional().isIn(STATUSES),
    body('assignee').optional({ nullable: true }).isMongoId(),
    body('labels').optional().isArray(),
  ],
  validate,
  ctrl.createTask
);

router.patch(
  '/:id',
  [
    param('id').isMongoId(),
    body('estimate').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(STATUSES),
    body('sprint').optional({ nullable: true }).isMongoId(),
    body('assignee').optional({ nullable: true }).isMongoId(),
  ],
  validate,
  ctrl.updateTask
);

router.patch(
  '/:id/move',
  [
    param('id').isMongoId(),
    body('status').optional().isIn(STATUSES),
    body('sprint').optional({ nullable: true }).isMongoId(),
    body('order').optional().isInt(),
  ],
  validate,
  ctrl.moveTask
);

router.post(
  '/:id/comments',
  [param('id').isMongoId(), body('body').isString().trim().notEmpty().withMessage('Commentaire vide.')],
  validate,
  ctrl.addComment
);

router.post(
  '/:id/timelogs',
  [
    param('id').isMongoId(),
    body('hours').isFloat({ gt: 0 }).withMessage('Le temps saisi doit être supérieur à 0.'),
    body('spentOn').optional().isISO8601(),
    body('note').optional().isString(),
  ],
  validate,
  ctrl.addTimeLog
);

router.delete(
  '/:id/timelogs/:logId',
  [param('id').isMongoId(), param('logId').isMongoId()],
  validate,
  ctrl.removeTimeLog
);

router.post(
  '/:id/attachments',
  param('id').isMongoId(),
  validate,
  imageUpload.single('image'),
  ctrl.addAttachment
);

router.delete(
  '/:id/attachments/:attachmentId',
  [param('id').isMongoId(), param('attachmentId').isMongoId()],
  validate,
  ctrl.removeAttachment
);

router.delete('/:id', param('id').isMongoId(), validate, ctrl.deleteTask);

module.exports = router;
