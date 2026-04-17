import { Router } from 'express';
import contentController from '../controllers/contentController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole, canEditContent, canApproveContent } from '../middleware/rbac.js';

const router = Router();

// All routes require authentication and business context
router.use(authMiddleware);
router.use(requireRole('owner', 'admin', 'creator', 'reviewer', 'viewer'));

// Content routes
router.get('/', contentController.getContent);
router.post('/', 
  requireRole('owner', 'admin', 'creator'), 
  contentController.createContent
);
router.get('/:id', contentController.getContentById);
router.put('/:id', 
  requireRole('owner', 'admin', 'creator'),
  canEditContent,
  contentController.updateContent
);
router.delete('/:id', 
  requireRole('owner', 'admin'),
  contentController.deleteContent
);

// Workflow routes
router.post('/:id/submit', 
  requireRole('owner', 'admin', 'creator'),
  canEditContent,
  contentController.submitForReview
);

router.post('/:id/approve', 
  requireRole('owner', 'admin', 'reviewer'),
  canApproveContent,
  contentController.approveContent
);

router.post('/:id/reject', 
  requireRole('owner', 'admin', 'reviewer'),
  canApproveContent,
  contentController.rejectContent
);

router.post('/:id/mark-posted', 
  requireRole('owner', 'admin', 'creator'),
  contentController.markAsPosted
);

export default router;
