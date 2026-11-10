process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');
const seedAdmin = require('../src/config/seedAdmin');

const api = () => request(app);
const auth = (t) => ({ Authorization: `Bearer ${t}` });
const hoursFromNow = (h) => new Date(Date.now() + h * 3600000).toISOString();
const ctx = {};

before(async () => { await sequelize.sync({ force: true }); await seedAdmin(); });
after(async () => { await sequelize.close(); });

test('signup / login / me', async () => {
  const o = await api().post('/api/auth/signup').send({ name: 'Olivia Owner', email: 'o@x.com', password: 'secret1', role: 'OWNER' });
  assert.equal(o.status, 201);
  assert.equal(o.body.user.password, undefined);
  ctx.owner = o.body.token;
  const c = await api().post('/api/auth/signup').send({ name: 'Carl Customer', email: 'c@x.com', password: 'secret1' });
  ctx.customer = c.body.token;
  assert.equal(c.body.user.role, 'CUSTOMER');

  assert.equal((await api().post('/api/auth/signup').send({ name: 'Dup', email: 'c@x.com', password: 'secret1' })).status, 409);
  assert.equal((await api().post('/api/auth/signup').send({ name: 'Hax', email: 'h@x.com', password: 'secret1', role: 'ADMIN' })).status, 400);
  assert.equal((await api().post('/api/auth/login').send({ email: 'c@x.com', password: 'wrong' })).status, 401);

  const a = await api().post('/api/auth/login').send({ email: 'admin@parkora.com', password: 'Admin@12345' });
  assert.equal(a.status, 200);
  ctx.admin = a.body.token;
  const me = await api().get('/api/users/me').set(auth(ctx.customer));
  assert.equal(me.body.email, 'c@x.com');
});

test('parking CRUD + role rules', async () => {
  const body = { title: 'Test Garage', address: '1 Main St', city: 'Delhi', latitude: 28.6, longitude: 77.2, pricePerHour: 50, category: 'GARAGE', totalSlots: 1 };
  assert.equal((await api().post('/api/parking').set(auth(ctx.customer)).send(body)).status, 403);
  assert.equal((await api().post('/api/parking').send(body)).status, 401);
  const r = await api().post('/api/parking').set(auth(ctx.owner)).send(body);
  assert.equal(r.status, 201);
  ctx.space = r.body.id;
  const upd = await api().put(`/api/parking/${ctx.space}`).set(auth(ctx.owner)).send({ pricePerHour: 60 });
  assert.equal(upd.body.pricePerHour, 60);
  assert.equal((await api().put(`/api/parking/${ctx.space}`).set(auth(ctx.customer)).send({ pricePerHour: 1 })).status, 403);
  const mine = await api().get('/api/parking/my').set(auth(ctx.owner));
  assert.equal(mine.body.length, 1);
});

test('search & filters', async () => {
  let r = await api().get('/api/parking/search?location=delhi');
  assert.equal(r.body.length, 1);
  r = await api().get('/api/parking/search?location=mumbai');
  assert.equal(r.body.length, 0);
  r = await api().get('/api/parking/search?category=GARAGE&maxPrice=100');
  assert.equal(r.body.length, 1);
  r = await api().get('/api/parking/search?maxPrice=10');
  assert.equal(r.body.length, 0);
  r = await api().get('/api/parking/search?nearLat=28.6&nearLng=77.2&radiusKm=5');
  assert.equal(r.body.length, 1);
  assert.equal((await api().get('/api/parking/search?category=NOPE')).status, 400);
});

test('booking → conflict → pay → review → cancel flow', async () => {
  const v = await api().post('/api/vehicles').set(auth(ctx.customer)).send({ plateNumber: 'dl1ab1234', type: 'CAR' });
  assert.equal(v.body.plateNumber, 'DL1AB1234');

  const start = hoursFromNow(24), end = hoursFromNow(27);
  const b = await api().post('/api/bookings').set(auth(ctx.customer)).send({ parkingSpaceId: ctx.space, vehicleId: v.body.id, startTime: start, endTime: end });
  assert.equal(b.status, 201);
  assert.equal(b.body.status, 'PENDING');
  assert.equal(b.body.totalAmount, 180);
  ctx.booking = b.body.id;

  // single slot -> overlapping booking rejected
  const dup = await api().post('/api/bookings').set(auth(ctx.customer)).send({ parkingSpaceId: ctx.space, startTime: hoursFromNow(25), endTime: hoursFromNow(26) });
  assert.equal(dup.status, 409);
  assert.equal((await api().post('/api/bookings').set(auth(ctx.owner)).send({ parkingSpaceId: ctx.space, startTime: hoursFromNow(40), endTime: hoursFromNow(41) })).status, 400);
  assert.equal((await api().post('/api/bookings').set(auth(ctx.customer)).send({ parkingSpaceId: ctx.space, startTime: end, endTime: start })).status, 400);

  // availability filter hides the full space
  const avail = await api().get(`/api/parking/search?from=${encodeURIComponent(hoursFromNow(25))}&to=${encodeURIComponent(hoursFromNow(26))}`);
  assert.equal(avail.body.length, 0);

  // review blocked before paying
  assert.equal((await api().post('/api/reviews').set(auth(ctx.customer)).send({ parkingSpaceId: ctx.space, rating: 5 })).status, 403);

  const pay = await api().post(`/api/payments/pay-now/${ctx.booking}`).set(auth(ctx.customer));
  assert.equal(pay.status, 201);
  assert.equal(pay.body.status, 'SUCCESS');
  assert.equal((await api().post(`/api/payments/pay-now/${ctx.booking}`).set(auth(ctx.customer))).status, 400);

  const my = await api().get('/api/bookings/my').set(auth(ctx.customer));
  assert.equal(my.body[0].status, 'CONFIRMED');
  const ownerView = await api().get('/api/bookings/owner').set(auth(ctx.owner));
  assert.equal(ownerView.body.length, 1);
  assert.equal(ownerView.body[0].customer.email, 'c@x.com');
  assert.equal((await api().get('/api/bookings/owner').set(auth(ctx.customer))).status, 403);

  const rv = await api().post('/api/reviews').set(auth(ctx.customer)).send({ parkingSpaceId: ctx.space, rating: 4, comment: 'Nice' });
  assert.equal(rv.status, 201);
  const rv2 = await api().post('/api/reviews').set(auth(ctx.customer)).send({ parkingSpaceId: ctx.space, rating: 5 });
  assert.equal(rv2.status, 200);
  const list = await api().get(`/api/reviews/parking/${ctx.space}`);
  assert.equal(list.body.length, 1);
  const one = await api().get(`/api/parking/${ctx.space}`);
  assert.equal(one.body.avgRating, 5);

  // cannot delete a listing with upcoming bookings
  assert.equal((await api().delete(`/api/parking/${ctx.space}`).set(auth(ctx.owner))).status, 409);

  const cancel = await api().put(`/api/bookings/${ctx.booking}/cancel`).set(auth(ctx.customer));
  assert.equal(cancel.body.status, 'CANCELLED');
  assert.equal(cancel.body.payment.status, 'REFUNDED');
});

test('favorites, notifications, dashboards, admin', async () => {
  assert.equal((await api().post(`/api/favorites/${ctx.space}`).set(auth(ctx.customer))).status, 201);
  await api().post(`/api/favorites/${ctx.space}`).set(auth(ctx.customer)); // idempotent
  let fav = await api().get('/api/favorites').set(auth(ctx.customer));
  assert.equal(fav.body.length, 1);
  assert.equal((await api().delete(`/api/favorites/${ctx.space}`).set(auth(ctx.customer))).status, 204);
  fav = await api().get('/api/favorites').set(auth(ctx.customer));
  assert.equal(fav.body.length, 0);

  const n = await api().get('/api/notifications').set(auth(ctx.owner));
  assert.ok(n.body.items.length >= 2);
  assert.ok(n.body.unreadCount >= 2);
  await api().put('/api/notifications/read-all').set(auth(ctx.owner));
  assert.equal((await api().get('/api/notifications').set(auth(ctx.owner))).body.unreadCount, 0);

  const od = await api().get('/api/owner/dashboard').set(auth(ctx.owner));
  assert.equal(od.body.totalListings, 1);
  assert.equal(od.body.totalBookings, 1);
  assert.equal(od.body.earnings, 0); // payment was refunded on cancel
  const cd = await api().get('/api/customer/dashboard').set(auth(ctx.customer));
  assert.equal(cd.body.totalBookings, 1);

  assert.equal((await api().get('/api/admin/dashboard').set(auth(ctx.owner))).status, 403);
  const ad = await api().get('/api/admin/dashboard').set(auth(ctx.admin));
  assert.equal(ad.body.totalUsers, 3);
  assert.equal(ad.body.totalListings, 1);
  assert.equal((await api().get('/api/admin/users').set(auth(ctx.admin))).body.length, 3);
  assert.equal((await api().get('/api/admin/bookings').set(auth(ctx.admin))).body.length, 1);

  const users = (await api().get('/api/admin/users').set(auth(ctx.admin))).body;
  const cust = users.find((u) => u.email === 'c@x.com');
  const t = await api().put(`/api/admin/users/${cust.id}/toggle`).set(auth(ctx.admin));
  assert.equal(t.body.isActive, false);
  assert.equal((await api().get('/api/users/me').set(auth(ctx.customer))).status, 401);
  assert.equal((await api().post('/api/auth/login').send({ email: 'c@x.com', password: 'secret1' })).status, 403);
});

test('owner can delete listing without upcoming bookings', async () => {
  assert.equal((await api().delete(`/api/parking/${ctx.space}`).set(auth(ctx.owner))).status, 204);
  assert.equal((await api().get(`/api/parking/${ctx.space}`)).status, 404);
});
