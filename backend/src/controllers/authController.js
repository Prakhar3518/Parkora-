const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { User } = require('../models');
const { signToken } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../utils/errors');
const { notify } = require('../services/notificationService');

const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(100),
  phone: z.string().trim().max(20).optional(),
  role: z.enum(['CUSTOMER', 'OWNER']).default('CUSTOMER'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (await User.findOne({ where: { email } })) throw new ApiError(409, 'Email is already registered');
  const user = await User.create({ name, email, phone, role, password: await bcrypt.hash(password, 10) });
  await notify(user.id, `Welcome to Parkora, ${user.name}!`, 'WELCOME');
  res.status(201).json({ token: signToken(user), user });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'This account has been disabled');
  res.json({ token: signToken(user), user });
});

module.exports = { signupSchema, loginSchema, signup, login };
