const express = require('express');
const router = express.Router();
const { getMyCertificates } = require('../controllers/studentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/certificates', getMyCertificates);

module.exports = router;
