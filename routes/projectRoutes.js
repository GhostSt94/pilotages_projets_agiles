const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/role');
const ctrl = require('../controllers/projectController');
const sprintCtrl = require('../controllers/sprintController');

const router = express.Router();

router.use(authenticate);

router.get('/', ctrl.listProjects);
router.get('/:id', param('id').isMongoId(), validate, ctrl.getProject);
router.get('/:id/board', param('id').isMongoId(), validate, ctrl.getBoard);
router.get('/:id/sprints', param('id').isMongoId(), validate, sprintCtrl.listProjectSprints);

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
