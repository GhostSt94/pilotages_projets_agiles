const express = require('express');
const { query } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { getDashboard } = require('../controllers/dashboardController');

const router = express.Router();

router.use(authenticate);

router.get('/', query('sprint').isMongoId().withMessage('Paramètre « sprint » (ObjectId) requis.'), validate, getDashboard);

module.exports = router;
