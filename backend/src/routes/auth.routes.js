const router  = require('express').Router();
const ctrl    = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/login',            ctrl.login);
router.post('/logout',           authenticate, ctrl.logout);
router.get('/me',                authenticate, ctrl.me);
router.patch('/profile',         authenticate, ctrl.updateProfile);
router.patch('/change-password', authenticate, ctrl.changePassword);

module.exports = router;
