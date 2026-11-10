const { User, ParkingSpace, Booking, Payment } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errors');

const users = asyncHandler(async (_req, res) => res.json(await User.findAll({ order: [['createdAt', 'DESC']] })));

const toggleUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.id === req.user.id) throw new ApiError(400, 'You cannot disable your own account');
  await user.update({ isActive: !user.isActive });
  res.json(user);
});

const listings = asyncHandler(async (_req, res) =>
  res.json(await ParkingSpace.findAll({
    include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
  })),
);

const toggleListing = asyncHandler(async (req, res) => {
  const space = await ParkingSpace.findByPk(req.params.id);
  if (!space) throw new ApiError(404, 'Listing not found');
  await space.update({ isActive: !space.isActive });
  res.json(space);
});

const bookings = asyncHandler(async (_req, res) =>
  res.json(await Booking.findAll({
    include: [
      { model: ParkingSpace, as: 'parkingSpace', paranoid: false, attributes: ['id', 'title', 'city'] },
      { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
      { model: Payment, as: 'payment' },
    ],
    order: [['createdAt', 'DESC']],
  })),
);

module.exports = { users, toggleUser, listings, toggleListing, bookings };
