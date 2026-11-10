const { z } = require('zod');
const { Op } = require('sequelize');
const { ParkingSpace, User, Booking } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errors');
const { CATEGORIES } = require('../utils/enums');
const { withRatings, haversineKm, ACTIVE_BOOKING } = require('../services/parkingService');

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format');

const baseShape = {
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().min(3).max(255),
  city: z.string().trim().min(2).max(100),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  pricePerHour: z.coerce.number().positive().max(100000),
  category: z.enum(CATEGORIES).default('OPEN'),
  availableFrom: hhmm.default('00:00'),
  availableTo: hhmm.default('23:59'),
  totalSlots: z.coerce.number().int().min(1).max(500).default(1),
  images: z.array(z.string().url()).max(5).default([]),
  isActive: z.boolean().default(true),
};
const createSchema = z.object(baseShape);
const updateSchema = z.object(baseShape).partial();

const searchQuerySchema = z.object({
  location: z.string().trim().optional(),
  category: z.enum(CATEGORIES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  nearLat: z.coerce.number().optional(),
  nearLng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().max(200).default(10),
  sort: z.enum(['price_asc', 'price_desc', 'rating', 'distance']).optional(),
});

const ownerInclude = { model: User, as: 'owner', attributes: ['id', 'name'] };

const create = asyncHandler(async (req, res) => {
  const space = await ParkingSpace.create({ ...req.body, ownerId: req.user.id });
  res.status(201).json(space);
});

async function loadOwned(req) {
  const space = await ParkingSpace.findByPk(req.params.id);
  if (!space) throw new ApiError(404, 'Parking space not found');
  if (space.ownerId !== req.user.id && req.user.role !== 'ADMIN') throw new ApiError(403, 'Not your listing');
  return space;
}

const update = asyncHandler(async (req, res) => {
  const space = await loadOwned(req);
  await space.update(req.body);
  res.json(space);
});

const remove = asyncHandler(async (req, res) => {
  const space = await loadOwned(req);
  const upcoming = await Booking.count({
    where: { parkingSpaceId: space.id, status: { [Op.in]: ACTIVE_BOOKING }, endTime: { [Op.gt]: new Date() } },
  });
  if (upcoming > 0) throw new ApiError(409, 'Cannot delete a listing with upcoming bookings');
  await space.destroy(); // soft delete (paranoid)
  res.status(204).end();
});

const getOne = asyncHandler(async (req, res) => {
  const space = await ParkingSpace.findByPk(req.params.id, { include: [ownerInclude] });
  if (!space) throw new ApiError(404, 'Parking space not found');
  const [full] = await withRatings([space]);
  res.json(full);
});

const mine = asyncHandler(async (req, res) => {
  const spaces = await ParkingSpace.findAll({ where: { ownerId: req.user.id }, order: [['createdAt', 'DESC']] });
  res.json(await withRatings(spaces));
});

const search = asyncHandler(async (req, res) => {
  const q = req.query;
  const where = { isActive: true };
  if (q.category) where.category = q.category;
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    where.pricePerHour = {};
    if (q.minPrice !== undefined) where.pricePerHour[Op.gte] = q.minPrice;
    if (q.maxPrice !== undefined) where.pricePerHour[Op.lte] = q.maxPrice;
  }
  if (q.location) {
    const like = `%${q.location}%`;
    where[Op.or] = [{ city: { [Op.like]: like } }, { address: { [Op.like]: like } }, { title: { [Op.like]: like } }];
  }
  let spaces = await withRatings(await ParkingSpace.findAll({ where, include: [ownerInclude], limit: 500 }));

  if (q.nearLat !== undefined && q.nearLng !== undefined) {
    spaces = spaces
      .map((s) => ({ ...s, distanceKm: Math.round(haversineKm(q.nearLat, q.nearLng, s.latitude, s.longitude) * 10) / 10 }))
      .filter((s) => s.distanceKm <= q.radiusKm);
  }

  if (q.from && q.to && q.from < q.to) {
    const overlapping = await Booking.findAll({
      where: {
        parkingSpaceId: spaces.map((s) => s.id),
        status: { [Op.in]: ACTIVE_BOOKING },
        startTime: { [Op.lt]: q.to },
        endTime: { [Op.gt]: q.from },
      },
      attributes: ['parkingSpaceId'],
      raw: true,
    });
    const used = new Map();
    overlapping.forEach((b) => used.set(b.parkingSpaceId, (used.get(b.parkingSpaceId) || 0) + 1));
    spaces = spaces.filter((s) => (used.get(s.id) || 0) < s.totalSlots);
  }

  const sorters = {
    price_asc: (a, b) => a.pricePerHour - b.pricePerHour,
    price_desc: (a, b) => b.pricePerHour - a.pricePerHour,
    rating: (a, b) => (b.avgRating || 0) - (a.avgRating || 0),
    distance: (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
  };
  if (q.sort) spaces.sort(sorters[q.sort]);
  else spaces.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(spaces);
});

module.exports = { createSchema, updateSchema, searchQuerySchema, create, update, remove, getOne, mine, search };
