// Valid values for the Product.status column, which is a plain String in the schema rather than a
// Prisma enum. Because the database accepts any string, these constants are the only thing keeping
// the column consistent, so every read and write of a status must go through them.

// Lowercase is deliberate here: BlogPost already stores 'draft' / 'published' and changing that
// would mean migrating existing rows for no functional gain. Order and payment statuses introduced
// later use UPPERCASE because they are new tables with no legacy data to match.
const PRODUCT_STATUS = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const);

const PRODUCT_STATUS_VALUES = Object.freeze(Object.values(PRODUCT_STATUS));

module.exports = { PRODUCT_STATUS, PRODUCT_STATUS_VALUES };
