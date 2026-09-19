const fs = require('fs');
const path = require('path');

const ctrlPath = path.join(__dirname, 'controllers/product.controller.js');
let code = fs.readFileSync(ctrlPath, 'utf8');

const addVariantCode = `
// Adds a new variant to an existing product.
const addVariant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sku, price, compareAtPrice, stockQuantity, label } = req.body;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm');

  const existingSku = await prisma.productVariant.findUnique({ where: { sku } });
  if (existingSku) throw new ApiError(409, 'SKU_TAKEN', \`SKU đã tồn tại: \${sku}\`);

  const variantAttributes = label ? { label } : {};

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku,
      price: price || 0,
      compareAtPrice: compareAtPrice || null,
      stockQuantity: stockQuantity || 0,
      variantAttributes,
      variantKey: sku, // Use SKU as variantKey to satisfy constraints
    }
  });

  sendSuccess(res, variant, null, 201);
});

// Removes a variant. Ensures that at least one variant remains, because a product without
// variants cannot be bought.
const removeVariant = asyncHandler(async (req, res) => {
  const { variantId } = req.params;

  const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!existing) throw new ApiError(404, 'VARIANT_NOT_FOUND', 'Không tìm thấy biến thể');

  // Prevent deleting if it's the last variant
  const variantCount = await prisma.productVariant.count({ where: { productId: existing.productId } });
  if (variantCount <= 1) {
    throw new ApiError(400, 'LAST_VARIANT', 'Không thể xóa biến thể duy nhất của sản phẩm. Một sản phẩm phải có ít nhất một biến thể.');
  }

  await prisma.productVariant.delete({ where: { id: variantId } });
  sendSuccess(res, { message: 'Đã xóa biến thể' });
});
`;

// Insert before module.exports
code = code.replace('module.exports = {', addVariantCode + '\nmodule.exports = {\n  addVariant,\n  removeVariant,');
fs.writeFileSync(ctrlPath, code);
console.log('product.controller.js patched');

const routePath = path.join(__dirname, 'routes/product.route.js');
let routeCode = fs.readFileSync(routePath, 'utf8');

const routeLines = `
router.post(
  '/:id/variants',
  authenticate,
  requireRole('admin'),
  [
    body('sku').notEmpty().withMessage('SKU không được để trống'),
    body('price').isInt({ min: 0 }).withMessage('Giá không hợp lệ'),
    body('compareAtPrice').optional({ nullable: true }).isInt({ min: 0 }),
    body('stockQuantity').optional().isInt({ min: 0 }),
    validate,
  ],
  ctrl.addVariant
);

router.delete('/variants/:variantId', authenticate, requireRole('admin'), ctrl.removeVariant);
`;

routeCode = routeCode.replace('router.patch(', routeLines + '\nrouter.patch(');
fs.writeFileSync(routePath, routeCode);
console.log('product.route.js patched');

