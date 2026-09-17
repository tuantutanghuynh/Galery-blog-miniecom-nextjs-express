const router = require('express').Router();

router.use('/auth', require('./auth.route'));
router.use('/categories', require('./category.route'));
router.use('/products', require('./product.route'));
router.use('/blog', require('./blog.route'));
router.use('/uploads', require('./upload.route'));
router.use('/gallery', require('./gallery.route'));
router.use('/contact', require('./contact.route'));

module.exports = router;
