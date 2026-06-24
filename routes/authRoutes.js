const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { register, login } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').isString().trim().notEmpty().withMessage('Nom requis.'),
    body('email').isEmail().withMessage('Email invalide.'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe : 6 caractères minimum.'),
    body('dailyCapacityHours').optional().isFloat({ min: 0 }),
    body('workingDays').optional().isArray(),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email invalide.'),
    body('password').notEmpty().withMessage('Mot de passe requis.'),
  ],
  validate,
  login
);

module.exports = router;
