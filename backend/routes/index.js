const router = require('express').Router();

router.use('/auth', require('./auth.route'));
router.use('/blog', require('./blog.route'));
router.use('/uploads', require('./upload.route'));
router.use('/gallery', require('./gallery.route'));



module.exports = router;
