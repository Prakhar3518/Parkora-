const router = require('express').Router();
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const auth = require('../controllers/authController');
const users = require('../controllers/userController');
const parking = require('../controllers/parkingController');
const bookings = require('../controllers/bookingController');
const payments = require('../controllers/paymentController');
const reviews = require('../controllers/reviewController');
const favorites = require('../controllers/favoriteController');
const vehicles = require('../controllers/vehicleController');
const notifications = require('../controllers/notificationController');
const dashboards = require('../controllers/dashboardController');
const admin = require('../controllers/adminController');

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'parkora-api' }));

// Auth
router.post('/auth/signup', validate(auth.signupSchema), auth.signup);
router.post('/auth/login', validate(auth.loginSchema), auth.login);

// Users
router.get('/users/me', authenticate, users.getMe);
router.put('/users/me', authenticate, validate(users.updateSchema), users.updateMe);

// Parking (static paths before :id)
router.get('/parking', validate(parking.searchQuerySchema, 'query'), parking.search);
router.get('/parking/search', validate(parking.searchQuerySchema, 'query'), parking.search);
router.get('/parking/my', authenticate, authorize('OWNER', 'ADMIN'), parking.mine);
router.get('/parking/:id', parking.getOne);
router.post('/parking', authenticate, authorize('OWNER', 'ADMIN'), validate(parking.createSchema), parking.create);
router.put('/parking/:id', authenticate, authorize('OWNER', 'ADMIN'), validate(parking.updateSchema), parking.update);
router.delete('/parking/:id', authenticate, authorize('OWNER', 'ADMIN'), parking.remove);

// Bookings
router.post('/bookings', authenticate, authorize('CUSTOMER', 'OWNER'), validate(bookings.createSchema), bookings.create);
router.get('/bookings/my', authenticate, bookings.myBookings);
router.get('/bookings/owner', authenticate, authorize('OWNER', 'ADMIN'), bookings.ownerBookings);
router.put('/bookings/:id/cancel', authenticate, bookings.cancel);

// Payments
router.post('/payments/pay-now/:bookingId', authenticate, payments.payNow);
router.get('/payments/my', authenticate, payments.myPayments);

// Reviews
router.post('/reviews', authenticate, validate(reviews.createSchema), reviews.create);
router.get('/reviews/parking/:parkingId', reviews.listForParking);

// Favorites
router.get('/favorites', authenticate, favorites.list);
router.post('/favorites/:parkingId', authenticate, favorites.add);
router.delete('/favorites/:parkingId', authenticate, favorites.remove);

// Vehicles
router.get('/vehicles', authenticate, vehicles.list);
router.post('/vehicles', authenticate, validate(vehicles.createSchema), vehicles.create);
router.delete('/vehicles/:id', authenticate, vehicles.remove);

// Notifications
router.get('/notifications', authenticate, notifications.list);
router.put('/notifications/read-all', authenticate, notifications.markAllRead);
router.put('/notifications/:id/read', authenticate, notifications.markRead);

// Dashboards
router.get('/customer/dashboard', authenticate, dashboards.customer);
router.get('/owner/dashboard', authenticate, authorize('OWNER', 'ADMIN'), dashboards.owner);
router.get('/admin/dashboard', authenticate, authorize('ADMIN'), dashboards.admin);

// Admin
router.get('/admin/users', authenticate, authorize('ADMIN'), admin.users);
router.put('/admin/users/:id/toggle', authenticate, authorize('ADMIN'), admin.toggleUser);
router.get('/admin/listings', authenticate, authorize('ADMIN'), admin.listings);
router.put('/admin/listings/:id/toggle', authenticate, authorize('ADMIN'), admin.toggleListing);
router.get('/admin/bookings', authenticate, authorize('ADMIN'), admin.bookings);

module.exports = router;
