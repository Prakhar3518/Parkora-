# Parkora API Reference

Base URL: `http://localhost:8080/api`. Protected routes need `Authorization: Bearer <token>`.
Errors are JSON: `{ "message": "...", "errors": [{ "field", "message" }] }` (validation errors use HTTP 400).

## Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/signup` | `name, email, password, phone?, role (CUSTOMER\|OWNER)` | returns `{ token, user }` |
| POST | `/auth/login` | `email, password` | returns `{ token, user }` |

## Users
| GET | `/users/me` | | current profile |
|---|---|---|---|
| PUT | `/users/me` | `name?, phone?` | |

## Parking
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/parking`, `/parking/search` | public | Query: `location, category, minPrice, maxPrice, from, to, nearLat, nearLng, radiusKm, sort (price_asc\|price_desc\|rating\|distance)` |
| GET | `/parking/:id` | public | includes `avgRating`, `reviewCount`, `owner` |
| GET | `/parking/my` | OWNER | own listings |
| POST | `/parking` | OWNER | `title, address, city, latitude, longitude, pricePerHour, category, availableFrom, availableTo, totalSlots, images[], description?` |
| PUT | `/parking/:id` | OWNER (own) | partial update (also `isActive`) |
| DELETE | `/parking/:id` | OWNER (own) | soft delete; blocked if upcoming bookings exist |

Categories: `OPEN, COVERED, GARAGE, STREET, EV_CHARGING`. `from`/`to` (ISO) hide spaces fully booked in that window.

## Bookings
| Method | Path | Notes |
|---|---|---|
| POST | `/bookings` | `parkingSpaceId, startTime, endTime, vehicleId?` → `PENDING`; 409 if no slot free. Price = ceil(hours) × `pricePerHour` |
| GET | `/bookings/my` | customer's bookings (with payment & vehicle) |
| GET | `/bookings/owner` | OWNER: bookings on own listings |
| PUT | `/bookings/:id/cancel` | before start; refunds a successful payment |

## Payments
| POST | `/payments/pay-now/:bookingId` | stub: marks payment `SUCCESS`, booking `CONFIRMED` |
|---|---|---|
| GET | `/payments/my` | |

## Reviews / Favorites / Vehicles / Notifications
| Method | Path | Notes |
|---|---|---|
| POST | `/reviews` | `parkingSpaceId, rating 1-5, comment?` — requires a confirmed/completed booking; one review per user per space (re-post updates it) |
| GET | `/reviews/parking/:parkingId` | public |
| GET / POST / DELETE | `/favorites`, `/favorites/:parkingId` | |
| GET / POST / DELETE | `/vehicles`, `/vehicles/:id` | `plateNumber, type (CAR\|BIKE\|SUV\|EV\|TRUCK), model?` |
| GET | `/notifications` | `{ items, unreadCount }` |
| PUT | `/notifications/:id/read`, `/notifications/read-all` | |

## Dashboards & Admin
| GET | `/customer/dashboard` | any logged-in user |
|---|---|---|
| GET | `/owner/dashboard` | OWNER |
| GET | `/admin/dashboard` | ADMIN |
| GET | `/admin/users`, `/admin/listings`, `/admin/bookings` | ADMIN |
| PUT | `/admin/users/:id/toggle`, `/admin/listings/:id/toggle` | ADMIN — enable/disable |
