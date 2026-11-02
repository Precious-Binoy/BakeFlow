const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const ctrl    = require('../controllers/products.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Multer setup for product images
const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file,  cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g,'_')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  },
});

// Public read routes (counter and production also need product list)
router.get('/',           authenticate, ctrl.list);
router.get('/categories', authenticate, ctrl.categories);

// Admin-only write routes
router.post('/',              authenticate, authorize('admin'), upload.single('image'), ctrl.create);
router.put('/:id',            authenticate, authorize('admin'), upload.single('image'), ctrl.update);
router.patch('/:id/toggle',   authenticate, authorize('admin'), ctrl.toggleActive);

module.exports = router;
