import { Request, Response, NextFunction } from 'express';
import { reviewsService } from './reviews.service';
import { apiSuccess } from '../../utils/response';

export class ReviewsController {
  createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const review = await reviewsService.createReview(req.customer!.id, req.body);
      apiSuccess(res, review, 'Thank you! Your review has been submitted and +20 loyalty points awarded', 201);
    } catch (error) {
      next(error);
    }
  };

  replyReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { managerReply } = req.body;
      const review = await reviewsService.replyReview(parseInt(req.params.id, 10), managerReply);
      apiSuccess(res, review, 'Reply submitted successfully');
    } catch (error) {
      next(error);
    }
  };

  getPublicReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const reviews = await reviewsService.getPublicReviews(branchId, limit);
      apiSuccess(res, reviews);
    } catch (error) {
      next(error);
    }
  };

  getAllReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await reviewsService.getAllReviews({ branchId, page, limit });
      apiSuccess(res, result.data, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };
}

export const reviewsController = new ReviewsController();
