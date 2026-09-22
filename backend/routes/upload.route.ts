import { Router } from 'express';
import authenticate from '../middlewares/authenticate';
import requireRole from '../middlewares/requireRole';
import upload from '../middlewares/upload';
import * as ctrl from '../controllers/upload.controller';

const router = Router();

router.post('/image', authenticate, requireRole('admin'), upload.single('image'), ctrl.uploadImage);

export default router;
