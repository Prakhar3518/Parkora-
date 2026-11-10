const { Op, fn, col } = require('sequelize');
const { Review, Booking } = require('../models');

const ACTIVE_BOOKING = ['PENDING', 'CONFIRMED'];

/** Adds avgRating / reviewCount to each parking space (plain objects). */
async function withRatings(spaces) {
  const plain = spaces.map((s) => (s.toJSON ? s.toJSON() : s));
  if (!plain.length) return plain;
  const rows = await Review.findAll({
    attributes: ['parkingSpaceId', [fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'count']],
    where: { parkingSpaceId: plain.map((s) => s.id) },
    group: ['parkingSpaceId'],
    raw: true,
  });
  const byId = new Map(rows.map((r) => [r.parkingSpaceId, r]));
  return plain.map((s) => {
    const r = byId.get(s.id);
    return { ...s, avgRating: r ? Math.round(Number(r.avg) * 10) / 10 : null, reviewCount: r ? Number(r.count) : 0 };
  });
}

/** Number of active bookings overlapping [start, end) for a space. */
function countOverlaps(parkingSpaceId, start, end, options = {}) {
  return Booking.count({
    where: {
      parkingSpaceId,
      status: { [Op.in]: ACTIVE_BOOKING },
      startTime: { [Op.lt]: end },
      endTime: { [Op.gt]: start },
    },
    ...options,
  });
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { withRatings, countOverlaps, haversineKm, ACTIVE_BOOKING };
