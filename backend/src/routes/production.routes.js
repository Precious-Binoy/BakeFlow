const router = require('express').Router();
const ctrl   = require('../controllers/production.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('admin','production'));

router.get('/orders',             ctrl.listOrders);
router.patch('/orders/:id/start', ctrl.startPreparing);
router.patch('/orders/:id/ready', ctrl.markReady);
router.get('/history',            ctrl.history);

module.exports = router;
