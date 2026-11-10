const { Favorite, ParkingSpace } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errors');
const { withRatings } = require('../services/parkingService');

const add = asyncHandler(async (req, res) => {
  const space = await ParkingSpace.findByPk(req.params.parkingId);
  if (!space) throw new ApiError(404, 'Parking space not found');
  await Favorite.findOrCreate({ where: { userId: req.user.id, parkingSpaceId: space.id } });
  res.status(201).json({ parkingSpaceId: space.id, favorited: true });
});

const remove = asyncHandler(async (req, res) => {
  await Favorite.destroy({ where: { userId: req.user.id, parkingSpaceId: req.params.parkingId } });
  res.status(204).end();
});

const list = asyncHandler(async (req, res) => {
  const favs = await Favorite.findAll({
    where: { userId: req.user.id },
    include: [{ model: ParkingSpace, as: 'parkingSpace' }],
    order: [['createdAt', 'DESC']],
  });
  res.json(await withRatings(favs.map((f) => f.parkingSpace).filter(Boolean)));
});

module.exports = { add, remove, list };
