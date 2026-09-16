const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { databaseUrl } = require('../config/env');

// The one Prisma client the whole backend shares. Every controller imports this module
// rather than constructing its own client.

// Prisma 7 no longer opens the connection itself — it requires a driver adapter, so the
// `pg` pool is wired in here and the datasource block in schema.prisma carries no `url`
// (that moved to prisma.config.ts). Constructing `new PrismaClient()` anywhere else would
// both throw for the missing adapter and open a second connection pool, so this module
// stays the only place it happens and everything else reuses the exported instance.
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
