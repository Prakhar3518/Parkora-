const { z } = require('zod');
const { Vehicle } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errors');
const { VEHICLE_TYPES } = require('../utils/enums');

const createSchema = z.object({
  plateNumber: z.string().trim().toUpperCase().min(3).max(20),
  type: z.enum(VEHICLE_TYPES).default('CAR'),
  model: z.string().trim().max(100).optional(),
});

const create = asyncHandler(async (req, res) => res.status(201).json(await Vehicle.create({ ...req.body, userId: req.user.id })));
const list = asyncHandler(async (req, res) => res.json(await Vehicle.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] })));
const remove = asyncHandler(async (req, res) => {
  const v = await Vehicle.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!v) throw new ApiError(404, 'Vehicle not found');
  await v.destroy();
  res.status(204).end();
});

module.exports = { createSchema, create, list, remove };
