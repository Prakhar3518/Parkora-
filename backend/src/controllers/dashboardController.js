const { Op, fn, col } = require('sequelize');
const { User, ParkingSpace, Booking, Payment, Favorite } = require('../models');
const { asyncHandler } = require('../utils/errors');

const sum = async (where, include) => {
  const r = await Payment.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('Payment.amount')), 0), 'total']],
    where: { status: 'SUCCESS', ...where },
    include,
    raw: true,
  });
  return Number(r?.total || 0);
};

const owner = asyncHandler(async (req, res) => {
  const spaces = await ParkingSpace.findAll({ where: { ownerId: req.user.id }, attributes: ['id'], raw: true });
  const ids = spaces.map((s) => s.id);
  const bookingWhere = { parkingSpaceId: ids.length ? ids : [0] };
  const [totalBookings, confirmed, pending, earnings] = await Promise.all([
    Booking.count({ where: bookingWhere }),
    Booking.count({ where: { ...bookingWhere, status: { [Op.in]: ['CONFIRMED', 'COMPLETED'] } } }),
    Booking.count({ where: { ...bookingWhere, status: 'PENDING' } }),
    sum({}, [{ model: Booking, as: 'booking', attributes: [], required: true, where: bookingWhere }]),
  ]);
  res.json({ totalListings: ids.length, totalBookings, confirmedBookings: confirmed, pendingBookings: pending, earnings });
});

const customer = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const [totalBookings, upcoming, favorites, spent] = await Promise.all([
    Booking.count({ where: { customerId: uid } }),
    Booking.count({ where: { customerId: uid, status: { [Op.in]: ['PENDING', 'CONFIRMED'] }, endTime: { [Op.gt]: new Date() } } }),
    Favorite.count({ where: { userId: uid } }),
    sum({ customerId: uid }),
  ]);
  res.json({ totalBookings, upcomingBookings: upcoming, favorites, totalSpent: spent });
});

const admin = asyncHandler(async (_req, res) => {
  const [customers, owners, admins, listings, bookings, revenue] = await Promise.all([
    User.count({ where: { role: 'CUSTOMER' } }),
    User.count({ where: { role: 'OWNER' } }),
    User.count({ where: { role: 'ADMIN' } }),
    ParkingSpace.count(),
    Booking.count(),
    sum({}),
  ]);
  res.json({ totalUsers: customers + owners + admins, customers, owners, admins, totalListings: listings, totalBookings: bookings, revenue });
});

module.exports = { owner, customer, admin };
