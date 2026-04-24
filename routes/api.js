const express = require('express');
const apiController = require('../controllers/apiController');

const router = express.Router();

router.get('/health', apiController.health);
router.post('/fivem/logs', apiController.receiveFiveMLog);

module.exports = router;
