const { Notification } = require('../models');

const notify = (userId, message, type = 'INFO', options = {}) =>
  Notification.create({ userId, message, type }, options);

module.exports = { notify };
