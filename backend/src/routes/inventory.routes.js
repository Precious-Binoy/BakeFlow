const router = require('express').Router();
const ctrl   = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',                            ctrl.list);
router.get('/movements',                   ctrl.movements);
router.post('/:productId/add',    authorize('admin'), ctrl.addStock);
router.post('/:productId/adjust', authorize('admin'), ctrl.adjustStock);

module.exports = router;
