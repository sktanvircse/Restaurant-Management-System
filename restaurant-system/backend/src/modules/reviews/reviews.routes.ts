import { Router } from 'express';
import { reviewsController } from './reviews.controller';
import { authenticate, authenticateCustomer } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  createReviewSchema,
  replyReviewSchema,
} from './reviews.validation';

const router = Router();

// Public Reviews list (Website landing page / Reviews section)
router.get('/public', reviewsController.getPublicReviews);

// Customer Submit Review
router.post(
  '/',
  authenticateCustomer,
  validate({ body: createReviewSchema }),
  reviewsController.createReview
);

// Staff Management
router.get(
  '/',
  authenticate,
  authorize('reviews', 'view'),
  reviewsController.getAllReviews
);

router.post(
  '/:id/reply',
  authenticate,
  authorize('reviews', 'edit'),
  auditLog('reviews', 'REPLY_REVIEW'),
  validate({ body: replyReviewSchema }),
  reviewsController.replyReview
);

export const reviewsRoutes = router;
