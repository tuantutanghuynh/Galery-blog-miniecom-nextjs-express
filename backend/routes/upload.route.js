const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const upload = require('../middlewares/upload');
const ctrl = require('../controllers/upload.controller');

router.post('/image', authenticate, requireRole('admin'), upload.single('image'), ctrl.uploadImage);

module.exports = router;
