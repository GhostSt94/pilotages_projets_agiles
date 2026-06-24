const express = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/role');
const { getMe, listUsers, updateUser, getWorkload, createUser, resetPassword } = require('../controllers/userController');

const router = express.Router();

router.use(authenticate);

router.get('/me', getMe);

// Heures réalisées par membre (avant les routes paramétrées). ?project= optionnel.
router.get('/workload', requirePermission('user.view'), query('project').optional().isMongoId(), validate, getWorkload);

// Lecture (annuaire) : permission user.view. Création/modification : user.manage.
router.get('/', requirePermission('user.view'), listUsers);

// Création d'un utilisateur.
router.post(
  '/',
  requirePermission('user.manage'),
  [
    body('name').isString().trim().notEmpty().withMessage('Nom requis.'),
    body('email').isEmail().withMessage('Email invalide.'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe : 6 caractères minimum.'),
    body('role').optional().isString(),
    body('dailyCapacityHours').optional().isFloat({ min: 0 }),
    body('workingDays').optional().isArray(),
    body('team').optional().isString(),
  ],
  validate,
  createUser
);

router.patch(
  '/:id',
  requirePermission('user.manage'),
  [
    param('id').isMongoId(),
    body('dailyCapacityHours').optional().isFloat({ min: 0 }),
    body('workingDays').optional().isArray(),
    body('role').optional().isString(),
  ],
  validate,
  updateUser
);

// Réinitialisation du mot de passe (user.manage).
router.patch(
  '/:id/password',
  requirePermission('user.manage'),
  [param('id').isMongoId(), body('password').isLength({ min: 6 }).withMessage('Mot de passe : 6 caractères minimum.')],
  validate,
  resetPassword
);

module.exports = router;
