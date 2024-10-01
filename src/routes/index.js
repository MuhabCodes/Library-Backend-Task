const { Router } = require('express');

const bookRoutes = require('./bookRoutes');
const authRoutes = require('./authRoutes');

const router = Router();

router.use('/auth', authRoutes)
router.use('/books', bookRoutes)


module.exports = router;