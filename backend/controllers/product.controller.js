const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const { PRODUCT_STATUS } = require('../constants/product');

// Every read and write path for products, serving both the storefront and the admin dashboard.
// A product is a catalogue entry; the sellable things with a price and a stock count are its
// variants. Public listings expose only `active` products, and like blog and gallery they can be
// scoped to one brand's category tree because a single backend serves several storefronts.

// Returns the paginated list of products a visitor may see, ordered newest first, with pagination
// counters in `meta`. Only `active` products appear — drafts and archived rows stay hidden without
// a separate permission check, because the filter lives in the query itself. `pageSize` is capped
// at 50 so a crafted request cannot pull the whole catalogue in one call. The category filter
// expands to include child categories, otherwise a product filed under "Bình gốm" would be missing
// from the parent brand's listing.
const list = asyncHandler(async (req, res) => {
  const { page = '1', pageSize = '12', categorySlug } = req.query;
  const take = Math.min(Number(pageSize) || 12, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = { status: PRODUCT_STATUS.ACTIVE };

  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');
    const children = await prisma.category.findMany({ where: { parentId: category.id } });
    const categoryIds = [category.id, ...children.map((c) => c.id)];
    where.categoryId = { in: categoryIds };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { price: 'asc' } },
      },
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  sendSuccess(res, items, { page: Number(page), pageSize: take, total });
});

// Fetches one product by slug for the public detail page, including its category, images and
// variants. A product that is not `active` is reported as 404 rather than 403, so an outsider
// cannot probe the catalogue to learn that an unreleased product exists at a given URL. Variants
// come back sorted by price so the storefront can show "từ <giá thấp nhất>" without sorting again,
// and images by `position` so the admin's chosen order is what visitors see.
const getBySlug = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: true,
      images: { orderBy: { position: 'asc' } },
      variants: { orderBy: { price: 'asc' } },
    },
  });

  if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm');
  }

  sendSuccess(res, product);
});

// Admin-only listing that, unlike `list`, also returns drafts and archived products so the editor
// can find work in progress. It supports a case-insensitive `search` on the name and an optional
// `status` filter. The `categorySlug` filter matters just as much here as on the public side:
// leaving it out is what would let one brand's dashboard display the other brand's catalogue.
const adminList = asyncHandler(async (req, res) => {
  const { page = '1', pageSize = '20', status, categorySlug, search } = req.query;
  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = {};
  if (status) where.status = status;
  if (search) where.name = { contains: search, mode: 'insensitive' };

  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');
    const children = await prisma.category.findMany({ where: { parentId: category.id } });
    const categoryIds = [category.id, ...children.map((c) => c.id)];
    where.categoryId = { in: categoryIds };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { price: 'asc' } },
      },
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  sendSuccess(res, items, { page: Number(page), pageSize: take, total });
});

// Creates a product together with its variants and images in a single transaction, answering 201
// with the full row. All three are written at once because a product with no variant has nothing
// to sell — leaving it half-created would put a broken entry in the catalogue. The slug and every
// SKU are checked for collisions before writing so a duplicate returns a clear 409 instead of a raw
// Prisma constraint error, and `variantKey` falls back to the SKU so the compound unique index on
// (productId, variantKey) always has a value to work with.
const create = asyncHandler(async (req, res) => {
  const {
    categoryId,
    name,
    slug,
    description,
    brand,
    status,
    attributes,
    variants = [],
    images = [],
  } = req.body;

  const existingSlug = await prisma.product.findUnique({ where: { slug } });
  if (existingSlug) throw new ApiError(409, 'SLUG_TAKEN', 'Slug đã tồn tại, vui lòng chọn slug khác');

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');

  const skus = variants.map((v) => v.sku);
  if (new Set(skus).size !== skus.length) {
    throw new ApiError(422, 'DUPLICATE_SKU', 'Các biến thể không được trùng SKU');
  }
  const takenSku = await prisma.productVariant.findFirst({ where: { sku: { in: skus } } });
  if (takenSku) throw new ApiError(409, 'SKU_TAKEN', `SKU đã tồn tại: ${takenSku.sku}`);

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        categoryId,
        name,
        slug,
        description,
        brand,
        status: status || PRODUCT_STATUS.DRAFT,
        attributes: attributes ?? {},
      },
    });

    if (variants.length) {
      await tx.productVariant.createMany({
        data: variants.map((v) => ({
          productId: created.id,
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          stockQuantity: v.stockQuantity ?? 0,
          variantAttributes: v.variantAttributes ?? {},
          variantKey: v.variantKey || v.sku,
          imageUrl: v.imageUrl ?? null,
        })),
      });
    }

    if (images.length) {
      await tx.productImage.createMany({
        data: images.map((img, index) => ({
          productId: created.id,
          url: img.url,
          altText: img.altText ?? null,
          position: img.position ?? index,
        })),
      });
    }

    return tx.product.findUnique({
      where: { id: created.id },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { price: 'asc' } },
      },
    });
  });

  sendSuccess(res, product, null, 201);
});

// Updates a product's own fields, accepting a partial body so the admin form can send only what
// changed. Fields left `undefined` are stripped before the write, because handing them to Prisma
// would overwrite good data with null. A changed slug is checked against other rows first — note
// the `slug !== existing.slug` guard, without which saving a product untouched would collide with
// itself and always fail. Variants and images are deliberately not editable here: they carry stock
// and price, and mixing them into a general-purpose update is how a careless request silently
// wipes inventory. They get their own endpoints later.
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm');

  const { categoryId, name, slug, description, brand, status, attributes } = req.body;

  if (slug && slug !== existing.slug) {
    const takenSlug = await prisma.product.findUnique({ where: { slug } });
    if (takenSlug) throw new ApiError(409, 'SLUG_TAKEN', 'Slug đã tồn tại, vui lòng chọn slug khác');
  }

  if (categoryId && categoryId !== existing.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');
  }

  const data = { categoryId, name, slug, description, brand, status, attributes };
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

  const product = await prisma.product.update({
    where: { id },
    data,
    include: {
      category: true,
      images: { orderBy: { position: 'asc' } },
      variants: { orderBy: { price: 'asc' } },
    },
  });

  sendSuccess(res, product);
});

// Updates one variant's price and stock. This lives apart from `update` on purpose: those fields
// are the two most dangerous in the catalogue, and keeping them out of the general-purpose product
// endpoint means a partial form submission can never blank out inventory as a side effect.
//
// `stockQuantity` is set to an absolute number rather than adjusted by a delta, because that is
// what a stock-take gives you — the admin counts twelve vases on the shelf and types twelve. The
// value is rejected if it would fall below what is already reserved for pending orders, since that
// would promise customers goods that are spoken for. `reservedQuantity` itself is never editable by
// hand; it is owned by checkout and the sweeper.
const updateVariant = asyncHandler(async (req, res) => {
  const { price, compareAtPrice, stockQuantity, label } = req.body;

  const variant = await prisma.productVariant.findUnique({ where: { id: req.params.variantId } });
  if (!variant) throw new ApiError(404, 'VARIANT_NOT_FOUND', 'Không tìm thấy biến thể');

  if (stockQuantity !== undefined && stockQuantity < variant.reservedQuantity) {
    throw new ApiError(
      409,
      'STOCK_BELOW_RESERVED',
      `Không thể đặt tồn kho thấp hơn ${variant.reservedQuantity} đang giữ cho đơn chờ thanh toán`
    );
  }

  const data = { price, compareAtPrice, stockQuantity };
  if (label !== undefined) data.variantAttributes = { ...variant.variantAttributes, label };
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

  const updated = await prisma.productVariant.update({ where: { id: variant.id }, data });
  sendSuccess(res, updated);
});

// Permanently deletes a product along with its variants and images. The row is read first purely so
// a missing id answers with a clean 404 instead of the 500 Prisma raises when `delete` matches
// nothing. Deleting is destructive in a way archiving is not: any cart holding one of these
// variants loses that line (the foreign key cascades), so the admin UI should offer
// `status = 'archived'` as the normal way to retire a product and keep this for genuine mistakes.
// Past orders survive regardless, because `OrderItem` keeps a snapshot and its variant link is set
// to null rather than blocking the delete.
const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm');

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.productVariant.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ]);

  sendSuccess(res, { message: 'Đã xoá sản phẩm' });
});

module.exports = { list, getBySlug, adminList, create, update, updateVariant, remove };
