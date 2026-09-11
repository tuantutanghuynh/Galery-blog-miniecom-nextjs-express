const router = require('express').Router();

router.use('/auth', require('./auth.route'));
router.use('/blog', require('./blog.route'));


module.exports = router;
