const { z } = require('zod');
const { Op } = require('sequelize');
const { Review, Booking, ParkingSpace, User } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errors');
const { notify } = require('../services/notificationService');

const createSchema = z.object({
  parkingSpaceId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

const create = asyncHandler(async (req, res) => {
  const { parkingSpaceId, rating, comment } = req.body;
  const space = await ParkingSpace.findByPk(parkingSpaceId);
  if (!space) throw new ApiError(404, 'Parking space not found');
  const booked = await Booking.count({
    where: { customerId: req.user.id, parkingSpaceId, status: { [Op.in]: ['CONFIRMED', 'COMPLETED'] } },
  });
  if (!booked) throw new ApiError(403, 'You can only review spaces you have booked and paid for');

  const [review, created] = await Review.findOrCreate({
    where: { parkingSpaceId, customerId: req.user.id },
    defaults: { rating, comment },
  });
  if (!created) await review.update({ rating, comment });
  else await notify(space.ownerId, `${req.user.name} left a ${rating}★ review on "${space.title}".`, 'REVIEW');
  res.status(created ? 201 : 200).json(review);
});

const listForParking = asyncHandler(async (req, res) => {
  const rows = await Review.findAll({
    where: { parkingSpaceId: req.params.parkingId },
    include: [{ model: User, as: 'customer', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(rows);
});

module.exports = { createSchema, create, listForParking };
