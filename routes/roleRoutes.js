const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/role');
const ctrl = require('../controllers/roleController');

const router = express.Router();

router.use(authenticate);

// Lecture : tout utilisateur authentifié (le front a besoin des libellés/couleurs).
router.get('/', ctrl.listRoles);
router.get('/permissions', ctrl.listPermissions);

router.post(
  '/',
  requirePermission('role.manage'),
  [
    body('name').isString().trim().notEmpty().withMessage('Nom (identifiant) requis.'),
    body('label').isString().trim().notEmpty().withMessage('Libellé requis.'),
    body('color').optional().isString(),
    body('description').optional().isString(),
    body('permissions').optional().isArray(),
  ],
  validate,
  ctrl.createRole
);

router.patch(
  '/:id',
  requirePermission('role.manage'),
  [param('id').isMongoId(), body('permissions').optional().isArray()],
  validate,
  ctrl.updateRole
);

router.delete('/:id', requirePermission('role.manage'), param('id').isMongoId(), validate, ctrl.deleteRole);

module.exports = router;
