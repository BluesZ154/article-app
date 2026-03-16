import express from 'express';
import multer from 'multer';
import path from 'path';

import { 
  UserRegister, 
  UserLogin, 
  VerifyToken, 
  AuthMiddleware, 
  RefreshAccessToken, 
  UserLogout, 
  GetUserData, 
  UpdateUserData, 
  OTPverification, 
  SendingEmail,
  resendOtpHandler
} from '../controllers/auth.js';

import { body } from 'express-validator';

import { 
  GetAllArticles, 
  UploadArticle, 
  GetIdArticle, 
  GetUserArticle, 
  SearchArticle, 
  SearchUser, 
  FollowTarget, 
  UnfollowTarget, 
  LikeDislikeArticle, 
  DeleteArticle 
} from '../controllers/postController.js';

import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  max: 5,
  windowMs: 30 * 60 * 1000,
  handler: (req, res, next) => {
    return res.status(429).json({
      success: false,
      message: "Too many login attempts. Try again in 30 minutes."
    });
  }
});

const registerLimiter = rateLimit({
  max: 3,
  windowMs: 30 * 60 * 1000,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "You Have Made Too Many Requests, Please Try Again in 30 minutes"
    });
  }
});

const writeLimiter = rateLimit({
  max: 20,
  windowMs: 60 * 60 * 1000,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "You Have Made Too Many Requests, Please Try Again in 1 hour"
    });
  }
});

const socialLimiter = rateLimit({
  max: 60,
  windowMs: 60 * 1000,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "You Have Made Too Many Requests, Please Try Again in 1 minute"
    });
  }
});

const searchLimiter = rateLimit({
  max: 100,
  windowMs: 5 * 60 * 1000,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "You Have Made Too Many Requests, Please Try Again in 5 minutes"
    });
  }
});


const router = express.Router();

router.post('/auth/register', [
  body('username')
  .notEmpty().withMessage('Username is Required')
  .isLength({ min: 5, max:20 }).withMessage('Username must be 5-20 chars')
  .matches(/[a-zA-Z]/).withMessage('Username must contain alphabet'),

  body('email')
  .notEmpty().withMessage('Email is Required')
  .isLength({ min: 5, max: 30 }).withMessage('Email must be 5-15 chars')
  .isEmail().withMessage('Invalid Email Format'),

  body('password')
  .notEmpty().withMessage('Password is Required')
  .isLength({ min: 5 }).withMessage('Password must be at least 5 characters long')
  .matches(/[0-9]/).withMessage('Password must contain at least one digit')
  .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one symbol')
  .matches(/[a-zA-Z]/).withMessage('Password must contain at least one alphabet letter'),
], UserRegister);

router.post('/auth/login', loginLimiter, [
  body('email')
  .notEmpty().withMessage('Email is Required')
  .isLength({ min: 5, max: 30 }).withMessage('Email must be 11-15 chars')
  .isEmail().withMessage('Invalid Email Format'),

  body('password')
  .notEmpty().withMessage('Password is Required')
  .isLength({ min: 5 }).withMessage('Password must be at least 5 characters long')
  .matches(/[0-9]/).withMessage('Password must contain at least one digit')
  .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one symbol')
  .matches(/[a-zA-Z]/).withMessage('Password must contain at least one alphabet letter'),
], UserLogin);

router.get('/auth/verify', VerifyToken);
router.post('/auth/refresh', loginLimiter, RefreshAccessToken);
router.get('/auth/logout', UserLogout);
router.post('/auth/id', GetUserData);
router.post('/auth/otp-verify', OTPverification);
router.post('/auth/resend', resendOtpHandler);

router.post('/auth/update/id', writeLimiter, UpdateUserData);
router.post('/auth/follow', socialLimiter, FollowTarget);
router.post('/auth/unfollow', socialLimiter, UnfollowTarget);

router.post('/article/upload', AuthMiddleware, writeLimiter, UploadArticle);
router.get('/article/all', AuthMiddleware, GetAllArticles);
router.post('/article/id', AuthMiddleware, searchLimiter, GetIdArticle);
router.post('/article/user', AuthMiddleware, searchLimiter, GetUserArticle);
router.post('/article/searchArticle', AuthMiddleware, searchLimiter,SearchArticle);
router.post('/article/searchUser', AuthMiddleware, searchLimiter, SearchUser);
router.post('/article/like-dislike', AuthMiddleware, socialLimiter, LikeDislikeArticle);
router.post('/article/delete', AuthMiddleware, writeLimiter, DeleteArticle);


export default router