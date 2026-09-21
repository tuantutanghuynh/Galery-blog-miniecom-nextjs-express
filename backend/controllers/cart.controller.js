const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const { PRODUCT_STATUS } = require('../constants/product');

// The shopping cart, one per user per brand. A cart row stores only which variant and how many —
// never a price. Prices are read back from the database on every display and again when the order
// is placed, so a cart left open for a week can never lock in yesterday's price.

// Loads the caller's cart for the current brand, or an empty shell if they have none yet, and
// recomputes every line total from today's prices. Each line carries its own warnings instead of
// failing the whole request: a cart holding one sold-out item should still render, with that item
// flagged, rather than returning an error and showing the customer nothing. Availability is
// `stockQuantity - reservedQuantity`, because units held for someone else's pending order are not
// ours to sell. `hasIssues` lets the storefront disable the checkout button without re-scanning
// every line itself.
const getCart = asyncHandler(async (req, res) => {
  const cart = await prisma.cart.findUnique({
    where: { userId_brandSlug: { userId: req.user.id, brandSlug: req.brand.slug } },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
        include: {
          variant: {
            include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
          },
        },
      },
    },
  });

  if (!cart) {
    return sendSuccess(res, { id: null, brandSlug: req.brand.slug, items: [], subtotal: 0, hasIssues: false });
  }

  const items = cart.items.map((item) => {
    const { variant } = item;
    const available = variant.stockQuantity - variant.reservedQuantity;
    const warnings = [];

    if (variant.product.status !== PRODUCT_STATUS.ACTIVE) warnings.push('UNAVAILABLE');
    else if (available <= 0) warnings.push('OUT_OF_STOCK');
    else if (item.quantity > available) warnings.push('INSUFFICIENT_STOCK');

    return {
      id: item.id,
      quantity: item.quantity,
      unitPrice: variant.price,
      lineTotal: variant.price * item.quantity,
      available,
      warnings,
      variant: {
        id: variant.id,
        sku: variant.sku,
        variantAttributes: variant.variantAttributes,
        imageUrl: variant.imageUrl || variant.product.images[0]?.url || null,
      },
      product: {
        id: variant.product.id,
        name: variant.product.name,
        slug: variant.product.slug,
      },
    };
  });

  sendSuccess(res, {
    id: cart.id,
    brandSlug: cart.brandSlug,
    items,
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    hasIssues: items.some((i) => i.warnings.length > 0),
  });
});

// Adds a variant to the cart, creating the cart on first use. Stock is checked leniently here —
// exceeding it is reported back as a warning rather than refused — because the real check belongs
// at checkout, where stock is actually reserved. Blocking now would be both too strict (the item
// may be restocked before they pay) and not strict enough (stock can sell out between now and
// checkout anyway), so only one of the two checks can be trusted, and it is the later one.
// Adding a variant that is already in the cart increments the existing line rather than creating a
// duplicate, which is what the unique index on (cartId, variantId) enforces.
const addItem = asyncHandler(async (req, res) => {
  const { variantId, quantity = 1 } = req.body;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant) throw new ApiError(404, 'VARIANT_NOT_FOUND', 'Không tìm thấy biến thể sản phẩm');

  if (variant.product.status !== PRODUCT_STATUS.ACTIVE) {
    throw new ApiError(409, 'PRODUCT_UNAVAILABLE', 'Sản phẩm hiện không bán');
  }

  // A variant from another brand must never land in this cart, or the petshop storefront could be
  // used to buy pottery by posting a guessed id.
  if (!req.brand.categoryIds.includes(variant.product.categoryId)) {
    throw new ApiError(404, 'VARIANT_NOT_FOUND', 'Không tìm thấy biến thể sản phẩm');
  }

  const cart = await prisma.cart.upsert({
    where: { userId_brandSlug: { userId: req.user.id, brandSlug: req.brand.slug } },
    create: { userId: req.user.id, brandSlug: req.brand.slug },
    update: {},
  });

  const item = await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity },
    update: { quantity: { increment: quantity } },
  });

  const available = variant.stockQuantity - variant.reservedQuantity;
  const warning = item.quantity > available ? 'INSUFFICIENT_STOCK' : null;

  sendSuccess(res, { id: item.id, quantity: item.quantity, available, warning }, null, 201);
});

// Sets a line to an exact quantity, used by the stepper control in the cart page. The line is
// fetched through its cart so a crafted id belonging to somebody else's cart answers 404 rather
// than letting one customer edit another's basket. Quantity is replaced, not incremented, because
// the client sends the value it wants to end up with; incrementing here would double up whenever a
// request is retried after a flaky connection.
const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  const item = await prisma.cartItem.findFirst({
    where: { id: req.params.id, cart: { userId: req.user.id, brandSlug: req.brand.slug } },
    include: { variant: true },
  });
  if (!item) throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy sản phẩm trong giỏ');

  const updated = await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });

  const available = item.variant.stockQuantity - item.variant.reservedQuantity;
  const warning = updated.quantity > available ? 'INSUFFICIENT_STOCK' : null;

  sendSuccess(res, { id: updated.id, quantity: updated.quantity, available, warning });
});

// Removes one line from the cart. Like `updateItem`, the lookup is scoped to the caller's own cart
// so the id alone is not enough to delete somebody else's line. Deleting the last item leaves an
// empty cart row rather than removing it, which keeps the next `addItem` from having to recreate
// one and costs a single unused row per user.
const removeItem = asyncHandler(async (req, res) => {
  const item = await prisma.cartItem.findFirst({
    where: { id: req.params.id, cart: { userId: req.user.id, brandSlug: req.brand.slug } },
  });
  if (!item) throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy sản phẩm trong giỏ');

  await prisma.cartItem.delete({ where: { id: item.id } });
  sendSuccess(res, { message: 'Đã xoá khỏi giỏ hàng' });
});

module.exports = { getCart, addItem, updateItem, removeItem };
