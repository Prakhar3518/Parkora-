# Upgrading the payment stub to Razorpay

Today `POST /api/payments/pay-now/:bookingId` marks the booking paid instantly. To go live:

1. `cd backend && npm i razorpay`, set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` and `PAYMENT_MODE=razorpay`.
2. **Create order** — new endpoint `POST /api/payments/create-order/:bookingId`: verify the booking is the caller's and `PENDING`,
   call `razorpay.orders.create({ amount: totalAmount * 100, currency: 'INR', receipt: 'booking_' + id })`, store a `Payment` row with
   `status: 'PENDING'` and `transactionId = order.id`, and return `{ orderId, amount, keyId }`.
3. **Checkout** — in the frontend load `https://checkout.razorpay.com/v1/checkout.js` and open `new Razorpay({ key, order_id, handler })`.
4. **Verify** — `POST /api/payments/verify` with `razorpay_order_id, razorpay_payment_id, razorpay_signature`. Compute
   `HMAC_SHA256(order_id + '|' + payment_id, KEY_SECRET)` and compare with `crypto.timingSafeEqual`. Only on success set the payment to
   `SUCCESS` and the booking to `CONFIRMED` (reuse the transaction + notifications in `paymentController.payNow`).
5. Add a signed webhook (`payment.captured`, `payment.failed`) as a safety net, and implement real refunds in `bookingController.cancel`.
