const crypto = require('crypto');
const { sequelize, Booking, Payment, ParkingSpace } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errors');
const { notify } = require('../services/notificationService');

/**
 * STUB payment: simulates a successful payment and confirms the booking.
 * See docs/RAZORPAY.md for swapping this with a real Razorpay order + signature verification.
 */
const payNow = asyncHandler(async (req, res) => {
  const payment = await sequelize.transaction(async (t) => {
    const booking = await Booking.findByPk(req.params.bookingId, {
      include: [{ model: ParkingSpace, as: 'parkingSpace', paranoid: false }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.customerId !== req.user.id) throw new ApiError(403, 'Not your booking');
    if (booking.status !== 'PENDING') throw new ApiError(400, `Booking is ${booking.status.toLowerCase()}, cannot pay`);

    const p = await Payment.create(
      {
        bookingId: booking.id,
        customerId: req.user.id,
        amount: booking.totalAmount,
        status: 'SUCCESS',
        method: 'STUB',
        transactionId: `STUB_${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      },
      { transaction: t },
    );
    await booking.update({ status: 'CONFIRMED' }, { transaction: t });
    await notify(req.user.id, `Payment of ₹${booking.totalAmount} received. Booking #${booking.id} confirmed!`, 'PAYMENT', { transaction: t });
    await notify(booking.parkingSpace.ownerId, `Booking #${booking.id} for "${booking.parkingSpace.title}" is confirmed and paid.`, 'PAYMENT', { transaction: t });
    return p;
  });
  res.status(201).json(payment);
});

const myPayments = asyncHandler(async (req, res) => {
  const rows = await Payment.findAll({
    where: { customerId: req.user.id },
    include: [{ model: Booking, as: 'booking', include: [{ model: ParkingSpace, as: 'parkingSpace', paranoid: false, attributes: ['id', 'title'] }] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(rows);
});

module.exports = { payNow, myPayments };
