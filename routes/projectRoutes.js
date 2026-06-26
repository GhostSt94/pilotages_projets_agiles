const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/role');
const ctrl = require('../controllers/projectController');
const sprintCtrl = require('../controllers/sprintController');
const statusCtrl = require('../controllers/statusController');

const router = express.Router();

router.use(authenticate);

router.get('/', ctrl.listProjects);
router.get('/:id', param('id').isMongoId(), validate, ctrl.getProject);
router.get('/:id/board', param('id').isMongoId(), validate, ctrl.getBoard);
router.get('/:id/sprints', param('id').isMongoId(), validate, sprintCtrl.listProjectSprints);

// --- Statuts (colonnes Kanban) du projet ---
router.get('/:id/statuses', param('id').isMongoId(), validate, statusCtrl.listStatuses);
router.post(
  '/:id/statuses',
  requirePermission('status.manage'),
  [param('id').isMongoId(), body('label').isString().trim().notEmpty().withMessage('Libellé requis.'), body('color').optional().isString(), body('isDone').optional().isBoolean()],
  validate,
  statusCtrl.createStatus
);
router.patch(
  '/:id/statuses/reorder',
  requirePermission('status.manage'),
  [param('id').isMongoId(), body('order').isArray().withMessage('order doit être un tableau.')],
  validate,
  statusCtrl.reorderStatuses
);
router.patch(
  '/:id/statuses/:statusId',
  requirePermission('status.manage'),
  [param('id').isMongoId(), param('statusId').isMongoId(), body('label').optional().isString(), body('color').optional().isString(), body('isDone').optional().isBoolean()],
  validate,
  statusCtrl.updateStatus
);
router.delete(
  '/:id/statuses/:statusId',
  requirePermission('status.manage'),
  [param('id').isMongoId(), param('statusId').isMongoId()],
  validate,
  statusCtrl.deleteStatus
);

router.post(
  '/',
  requirePermission('project.manage'),
  [
    body('name').isString().trim().notEmpty().withMessage('Nom requis.'),
    body('key').isString().trim().notEmpty().withMessage('Clé requise.'),
    body('description').optional().isString(),
    body('members').optional().isArray(),
  ],
  validate,
  ctrl.createProject
);

router.patch(
  '/:id',
  requirePermission('project.manage'),
  [
    param('id').isMongoId(),
    body('status').optional().isIn(['active', 'archived']),
  ],
  validate,
  ctrl.updateProject
);

router.delete('/:id', requirePermission('project.manage'), param('id').isMongoId(), validate, ctrl.deleteProject);

router.post(
  '/:id/members',
  requirePermission('project.manage'),
  [param('id').isMongoId(), body('userId').isMongoId().withMessage('userId invalide.')],
  validate,
  ctrl.addMember
);

router.delete(
  '/:id/members/:userId',
  requirePermission('project.manage'),
  [param('id').isMongoId(), param('userId').isMongoId()],
  validate,
  ctrl.removeMember
);

module.exports = router;
