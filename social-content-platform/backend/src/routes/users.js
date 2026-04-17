import { Router } from 'express';
import userController from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// All routes require authentication and business context
router.use(authMiddleware);
router.use(requireRole('owner', 'admin', 'creator', 'reviewer', 'viewer'));

// Team member routes
router.get('/', userController.getTeamMembers);

// Invite and manage members (owner and admin only)
router.post('/invite', 
  requireRole('owner', 'admin'),
  userController.inviteMember
);

router.put('/:userId/role', 
  requireRole('owner', 'admin'),
  userController.updateMemberRole
);

router.delete('/:userId', 
  requireRole('owner', 'admin'),
  userController.removeMember
);

// Accept invitation (public endpoint, but token-based)
router.post('/accept-invitation', userController.acceptInvitation);

export default router;
