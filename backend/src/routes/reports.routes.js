const router = require('express').Router();
const ctrl   = require('../controllers/reports.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('admin'));

router.get('/dashboard',      ctrl.dashboard);
router.get('/sales',          ctrl.sales);
router.get('/best-sellers',   ctrl.bestSellers);
router.get('/order-summary',  ctrl.orderSummary);

module.exports = router;
