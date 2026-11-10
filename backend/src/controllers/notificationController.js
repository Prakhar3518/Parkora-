const { Notification } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errors');

const list = asyncHandler(async (req, res) => {
  const [items, unreadCount] = await Promise.all([
    Notification.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']], limit: 50 }),
    Notification.count({ where: { userId: req.user.id, isRead: false } }),
  ]);
  res.json({ items, unreadCount });
});

const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!n) throw new ApiError(404, 'Notification not found');
  await n.update({ isRead: true });
  res.json(n);
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
  res.json({ ok: true });
});

module.exports = { list, markRead, markAllRead };
