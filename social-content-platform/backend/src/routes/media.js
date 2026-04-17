import { Router } from 'express';
import mediaController from '../controllers/mediaController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import upload, { handleMulterError } from '../middleware/upload.js';

const router = Router();

// All routes require authentication and business context
router.use(authMiddleware);
router.use(requireRole('owner', 'admin', 'creator', 'reviewer', 'viewer'));

// Media routes
router.get('/', mediaController.getMedia);

router.post('/upload', 
  requireRole('owner', 'admin', 'creator'),
  upload.single('file'),
  handleMulterError,
  mediaController.uploadMedia
);

router.delete('/:id', 
  requireRole('owner', 'admin'),
  mediaController.deleteMedia
);

export default router;
