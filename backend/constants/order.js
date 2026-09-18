// Valid values for the order, payment and fulfilment columns, which are plain Strings in the schema
// rather than Prisma enums. The database accepts any string, so these constants are the only thing
// keeping the columns consistent, and every transition must be checked against them.

// UPPERCASE here, unlike PRODUCT_STATUS which is lowercase. These are new tables with no legacy
// rows to match, so they follow the convention used for state machines; Product and BlogPost keep
// lowercase because changing them would mean migrating existing data for no functional gain.
const ORDER_STATUS = Object.freeze({
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

const PAYMENT_METHOD = Object.freeze({
  BANK_TRANSFER: 'BANK_TRANSFER', // gomsu: hold stock, wait for the transfer
  COD: 'COD', // petshop: deduct stock now, courier collects cash
  VNPAY: 'VNPAY', // reserved for the payment gateway work
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING', // waiting for the customer to pay
  PAID: 'PAID',
  UNPAID: 'UNPAID', // COD — money is collected on delivery
  FAILED: 'FAILED', // a payment was attempted and rejected
  EXPIRED: 'EXPIRED', // nobody ever paid and the hold ran out
});

// Which order statuses may follow which. A transition not listed here is rejected rather than
// written, so a bug cannot move an order from CANCELLED back to CONFIRMED and resurrect an order
// whose stock has already been returned. Terminal states map to an empty list on purpose — that is
// what makes them terminal.
const ORDER_TRANSITIONS = Object.freeze({
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
});

// How long an unpaid bank-transfer order holds its stock before a cleanup job may cancel it and
// release the reservation. Anything shorter punishes customers who pay by app outside banking
// hours; anything longer keeps scarce hand-made pieces off the shelf for someone who has probably
// changed their mind.
const PAYMENT_WINDOW_HOURS = 24;

// How often the cleanup job looks for expired orders. It does not need to be precise — an order
// held fifteen minutes past its deadline harms nobody — and running it rarely keeps the query off
// the database most of the time.
const SWEEP_INTERVAL_MINUTES = 15;

// Shipping is not calculated yet — no carrier integration exists. This is deliberately a named
// constant rather than a literal 0 inside the total, so the day a real rate table arrives there is
// exactly one place to change, and so a reader can tell this is "not built yet" rather than
// "delivery is free".
const SHIPPING_FEE_NOT_CALCULATED = 0;

module.exports = {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  ORDER_TRANSITIONS,
  PAYMENT_WINDOW_HOURS,
  SWEEP_INTERVAL_MINUTES,
  SHIPPING_FEE_NOT_CALCULATED,
};
