const { z } = require('zod');
const { Op } = require('sequelize');
const { sequelize, Booking, ParkingSpace, Vehicle, Payment, User } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errors');
const { countOverlaps } = require('../services/parkingService');
const { notify } = require('../services/notificationService');

const createSchema = z.object({
  parkingSpaceId: z.coerce.number().int().positive(),
  vehicleId: z.coerce.number().int().positive().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
});

const bookingInclude = [
  { model: ParkingSpace, as: 'parkingSpace', paranoid: false, attributes: ['id', 'title', 'address', 'city', 'pricePerHour', 'images', 'ownerId'] },
  { model: Payment, as: 'payment' },
  { model: Vehicle, as: 'vehicle' },
];

/** Marks confirmed bookings in the past as COMPLETED. */
const completeFinished = () =>
  Booking.update({ status: 'COMPLETED' }, { where: { status: 'CONFIRMED', endTime: { [Op.lt]: new Date() } } });

const create = asyncHandler(async (req, res) => {
  const { parkingSpaceId, vehicleId, startTime, endTime } = req.body;
  if (endTime <= startTime) throw new ApiError(400, 'End time must be after start time');
  if (startTime < new Date(Date.now() - 5 * 60 * 1000)) throw new ApiError(400, 'Start time cannot be in the past');

  const result = await sequelize.transaction(async (t) => {
    const space = await ParkingSpace.findByPk(parkingSpaceId, { transaction: t });
    if (!space || !space.isActive) throw new ApiError(404, 'Parking space not available');
    if (space.ownerId === req.user.id) throw new ApiError(400, 'You cannot book your own parking space');
    if (vehicleId) {
      const v = await Vehicle.findOne({ where: { id: vehicleId, userId: req.user.id }, transaction: t });
      if (!v) throw new ApiError(404, 'Vehicle not found');
    }
    const overlaps = await countOverlaps(space.id, startTime, endTime, { transaction: t });
    if (overlaps >= space.totalSlots) throw new ApiError(409, 'No slots available for the selected time');

    const hours = Math.ceil((endTime - startTime) / 3600000);
    const booking = await Booking.create(
      { customerId: req.user.id, parkingSpaceId, vehicleId, startTime, endTime, totalAmount: hours * space.pricePerHour },
      { transaction: t },
    );
    await notify(space.ownerId, `New booking request for "${space.title}" from ${req.user.name}.`, 'BOOKING', { transaction: t });
    return booking;
  });

  const full = await Booking.findByPk(result.id, { include: bookingInclude });
  res.status(201).json(full);
});

const myBookings = asyncHandler(async (req, res) => {
  await completeFinished();
  const rows = await Booking.findAll({
    where: { customerId: req.user.id },
    include: bookingInclude,
    order: [['createdAt', 'DESC']],
  });
  res.json(rows);
});

const ownerBookings = asyncHandler(async (req, res) => {
  await completeFinished();
  const rows = await Booking.findAll({
    include: [
      { model: ParkingSpace, as: 'parkingSpace', paranoid: false, where: { ownerId: req.user.id }, attributes: ['id', 'title', 'address', 'city'] },
      { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
      { model: Vehicle, as: 'vehicle' },
      { model: Payment, as: 'payment' },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.json(rows);
});

const cancel = asyncHandler(async (req, res) => {
  await sequelize.transaction(async (t) => {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: ParkingSpace, as: 'parkingSpace', paranoid: false }, { model: Payment, as: 'payment' }],
      transaction: t,
    });
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.customerId !== req.user.id && req.user.role !== 'ADMIN') throw new ApiError(403, 'Not your booking');
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) throw new ApiError(400, `Booking is already ${booking.status.toLowerCase()}`);
    if (booking.startTime <= new Date()) throw new ApiError(400, 'Cannot cancel a booking that has already started');

    await booking.update({ status: 'CANCELLED' }, { transaction: t });
    if (booking.payment && booking.payment.status === 'SUCCESS') {
      await booking.payment.update({ status: 'REFUNDED' }, { transaction: t });
    }
    await notify(booking.parkingSpace.ownerId, `A booking for "${booking.parkingSpace.title}" was cancelled.`, 'BOOKING', { transaction: t });
  });
  const full = await Booking.findByPk(req.params.id, { include: bookingInclude });
  res.json(full);
});

module.exports = { createSchema, create, myBookings, ownerBookings, cancel };
