import { Router } from 'express';
import { signup, login, getMe, refreshToken } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import {
  strictAuthLimiter,
  validateRequest,
  authValidation,
  securityAuditLog,
} from '../middleware/security';

const router = Router();

router.post(
  '/signup',
  strictAuthLimiter,
  securityAuditLog('user_signup_attempt'),
  validateRequest(authValidation.signup),
  signup
);

router.post(
  '/login',
  strictAuthLimiter,
  securityAuditLog('user_login_attempt'),
  validateRequest(authValidation.login),
  login
);

router.post('/refresh', strictAuthLimiter, refreshToken);
router.get('/me', authMiddleware, getMe);

export default router;
