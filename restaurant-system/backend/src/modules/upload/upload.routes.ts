import { Router, Request, Response, NextFunction } from 'express';
import { upload } from '../../middleware/upload';
import { authenticate } from '../../middleware/auth';
import { apiSuccess } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';

const router = Router();

router.post(
  '/',
  authenticate,
  upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      apiSuccess(
        res,
        {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
        },
        'File uploaded successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }
);

export const uploadRoutes = router;
