import { Router } from 'express';
import businessController from '../controllers/businessController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Business routes
router.get('/', businessController.getBusinesses);
router.post('/', businessController.createBusiness);
router.get('/:id', businessController.getBusiness);
router.put('/:id', businessController.updateBusiness);
router.delete('/:id', businessController.deleteBusiness);

export default router;
