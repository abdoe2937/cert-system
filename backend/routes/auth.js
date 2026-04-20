const express = require('express');
const router  = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload    = require('../middleware/upload');

// Register with image upload
router.post('/register', upload.single('profileImage'), register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
