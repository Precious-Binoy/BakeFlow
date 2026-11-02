const router = require('express').Router();
const ctrl   = require('../controllers/orders.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',           authorize('admin','counter'),              ctrl.list);
router.get('/:id',        authorize('admin','counter','production'), ctrl.getOne);
router.post('/',          authorize('admin','counter'),              ctrl.create);
router.patch('/:id/cancel',   authorize('admin','counter'),         ctrl.cancel);
router.patch('/:id/complete', authorize('admin','counter'),         ctrl.complete);

module.exports = router;
