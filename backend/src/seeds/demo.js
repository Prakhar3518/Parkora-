/* Demo data: owner + customer accounts and a few listings. Run: npm run seed */
const bcrypt = require('bcryptjs');
const { sequelize, User, ParkingSpace } = require('../models');
const seedAdmin = require('../config/seedAdmin');
const env = require('../config/env');

const spaces = [
  ['Connaught Place Covered Parking', 'Connaught Place, New Delhi', 'Delhi', 28.6315, 77.2167, 60, 'COVERED', 5],
  ['Bandra Kurla Complex Garage', 'BKC, Bandra East, Mumbai', 'Mumbai', 19.0690, 72.8683, 80, 'GARAGE', 4],
  ['Indiranagar Open Slot', '100 Feet Rd, Indiranagar, Bangalore', 'Bangalore', 12.9784, 77.6408, 40, 'OPEN', 3],
  ['Koregaon Park EV Charging Bay', 'Lane 5, Koregaon Park, Pune', 'Pune', 18.5362, 73.8940, 90, 'EV_CHARGING', 2],
  ['Cyber Hub Street Parking', 'DLF Cyber City, Gurugram', 'Gurugram', 28.4950, 77.0890, 50, 'STREET', 6],
];

(async () => {
  await sequelize.sync();
  await seedAdmin();
  const pw = await bcrypt.hash('Password@123', 10);
  const [owner] = await User.findOrCreate({ where: { email: 'owner@parkora.com' }, defaults: { name: 'Demo Owner', password: pw, role: 'OWNER', phone: '9000000001' } });
  await User.findOrCreate({ where: { email: 'customer@parkora.com' }, defaults: { name: 'Demo Customer', password: pw, role: 'CUSTOMER', phone: '9000000002' } });
  for (const [title, address, city, latitude, longitude, pricePerHour, category, totalSlots] of spaces) {
    await ParkingSpace.findOrCreate({
      where: { title, ownerId: owner.id },
      defaults: { address, city, latitude, longitude, pricePerHour, category, totalSlots, description: `Secure ${category.toLowerCase().replace('_', ' ')} parking in ${city}.`, images: [] },
    });
  }
  console.log('✔ Demo data ready');
  console.log(`  Admin:    ${env.admin.email} / ${env.admin.password}`);
  console.log('  Owner:    owner@parkora.com / Password@123');
  console.log('  Customer: customer@parkora.com / Password@123');
  await sequelize.close();
})().catch((e) => { console.error(e); process.exit(1); });
