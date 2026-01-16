import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import logger from '../utils/logger';

const SALT_ROUNDS = 10;

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      keywords: [],
      preferences: {
        alertFrequency: 'realtime',
        emailNotifications: true,
        darkMode: false,
      },
    });

    await user.save();

    const token = generateToken(user._id.toString(), user.email);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        keywords: user.keywords,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user._id.toString(), user.email);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        keywords: user.keywords,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        keywords: req.user.keywords,
        preferences: req.user.preferences,
      },
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const decoded = jwt.verify(token, jwtRefreshSecret) as { userId: string; email: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const newToken = generateToken(user._id.toString(), user.email);
    const newRefreshToken = generateRefreshToken(user._id.toString(), user.email);

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

function generateToken(userId: string, email: string): string {
  const jwtSecret = process.env.JWT_SECRET || 'default-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  
  return jwt.sign(
    { 
      userId, 
      email,
      iat: Math.floor(Date.now() / 1000),
    }, 
    jwtSecret, 
    { 
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    }
  );
}

function generateRefreshToken(userId: string, email: string): string {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '1d';
  
  return jwt.sign(
    { 
      userId, 
      email,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    }, 
    jwtRefreshSecret, 
    { 
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    }
  );
}
