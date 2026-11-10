const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const E = require('../utils/enums');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  phone: DataTypes.STRING(20),
  role: { type: DataTypes.ENUM(...E.ROLES), allowNull: false, defaultValue: 'CUSTOMER' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'users' });
User.prototype.toJSON = function toJSON() {
  const v = { ...this.get() };
  delete v.password;
  return v;
};

const ParkingSpace = sequelize.define('ParkingSpace', {
  title: { type: DataTypes.STRING(150), allowNull: false },
  description: DataTypes.TEXT,
  address: { type: DataTypes.STRING(255), allowNull: false },
  city: { type: DataTypes.STRING(100), allowNull: false },
  latitude: { type: DataTypes.DOUBLE, allowNull: false },
  longitude: { type: DataTypes.DOUBLE, allowNull: false },
  pricePerHour: { type: DataTypes.DOUBLE, allowNull: false },
  category: { type: DataTypes.ENUM(...E.CATEGORIES), allowNull: false, defaultValue: 'OPEN' },
  availableFrom: { type: DataTypes.STRING(5), allowNull: false, defaultValue: '00:00' },
  availableTo: { type: DataTypes.STRING(5), allowNull: false, defaultValue: '23:59' },
  totalSlots: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  images: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'parking_spaces', paranoid: true });

const Vehicle = sequelize.define('Vehicle', {
  plateNumber: { type: DataTypes.STRING(20), allowNull: false },
  type: { type: DataTypes.ENUM(...E.VEHICLE_TYPES), allowNull: false, defaultValue: 'CAR' },
  model: DataTypes.STRING(100),
}, { tableName: 'vehicles' });

const Booking = sequelize.define('Booking', {
  startTime: { type: DataTypes.DATE, allowNull: false },
  endTime: { type: DataTypes.DATE, allowNull: false },
  totalAmount: { type: DataTypes.DOUBLE, allowNull: false },
  status: { type: DataTypes.ENUM(...E.BOOKING_STATUS), allowNull: false, defaultValue: 'PENDING' },
}, { tableName: 'bookings' });

const Payment = sequelize.define('Payment', {
  amount: { type: DataTypes.DOUBLE, allowNull: false },
  status: { type: DataTypes.ENUM(...E.PAYMENT_STATUS), allowNull: false, defaultValue: 'PENDING' },
  method: { type: DataTypes.STRING(30), defaultValue: 'STUB' },
  transactionId: DataTypes.STRING(100),
}, { tableName: 'payments' });

const Review = sequelize.define('Review', {
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: DataTypes.TEXT,
}, {
  tableName: 'reviews',
  indexes: [{ unique: true, fields: ['parkingSpaceId', 'customerId'] }],
});

const Favorite = sequelize.define('Favorite', {}, {
  tableName: 'favorites',
  indexes: [{ unique: true, fields: ['userId', 'parkingSpaceId'] }],
});

const Notification = sequelize.define('Notification', {
  message: { type: DataTypes.STRING(500), allowNull: false },
  type: { type: DataTypes.STRING(30), defaultValue: 'INFO' },
  isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'notifications' });

// Associations
User.hasMany(ParkingSpace, { foreignKey: { name: 'ownerId', allowNull: false }, as: 'listings' });
ParkingSpace.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(Vehicle, { foreignKey: { name: 'userId', allowNull: false }, as: 'vehicles', onDelete: 'CASCADE' });
Vehicle.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Booking, { foreignKey: { name: 'customerId', allowNull: false }, as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
ParkingSpace.hasMany(Booking, { foreignKey: { name: 'parkingSpaceId', allowNull: false }, as: 'bookings' });
Booking.belongsTo(ParkingSpace, { foreignKey: 'parkingSpaceId', as: 'parkingSpace' });
Vehicle.hasMany(Booking, { foreignKey: 'vehicleId', onDelete: 'SET NULL' });
Booking.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

Booking.hasOne(Payment, { foreignKey: { name: 'bookingId', allowNull: false }, as: 'payment' });
Payment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
User.hasMany(Payment, { foreignKey: { name: 'customerId', allowNull: false }, as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

ParkingSpace.hasMany(Review, { foreignKey: { name: 'parkingSpaceId', allowNull: false }, as: 'reviews' });
Review.belongsTo(ParkingSpace, { foreignKey: 'parkingSpaceId', as: 'parkingSpace' });
User.hasMany(Review, { foreignKey: { name: 'customerId', allowNull: false }, as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Favorite, { foreignKey: { name: 'userId', allowNull: false }, as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId' });
ParkingSpace.hasMany(Favorite, { foreignKey: { name: 'parkingSpaceId', allowNull: false }, as: 'favorites' });
Favorite.belongsTo(ParkingSpace, { foreignKey: 'parkingSpaceId', as: 'parkingSpace' });

User.hasMany(Notification, { foreignKey: { name: 'userId', allowNull: false }, as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, ParkingSpace, Vehicle, Booking, Payment, Review, Favorite, Notification };
