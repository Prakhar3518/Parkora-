const { z } = require('zod');
const { asyncHandler } = require('../utils/errors');

const updateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
});

const getMe = asyncHandler(async (req, res) => res.json(req.user));

const updateMe = asyncHandler(async (req, res) => {
  await req.user.update(req.body);
  res.json(req.user);
});

module.exports = { updateSchema, getMe, updateMe };
