const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');

// Yêu cầu tư vấn mua hàng: khách chọn sản phẩm, để lại số điện thoại, nhân viên gọi lại và
// chốt đơn thủ công. Không có thanh toán, không trừ kho, không giữ hàng — nên ở đây không có
// transaction và không có bất kỳ thao tác nào lên tồn kho.

const QUOTE_STATUS = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  CLOSED: 'CLOSED',
};

const MAX_ITEMS = 50;

// Nhận yêu cầu từ khách vãng lai. Đây là endpoint công khai thứ hai (sau /contact) cho phép
// người lạ ghi vào database, nên nó mang theo honeypot giống hệt form liên hệ.
//
// Client chỉ gửi variantId và số lượng. Tên, SKU và giá đều do server đọc lại từ database —
// giá client gửi lên không bao giờ được tin, kể cả khi luồng này không hề chuyển tiền: nhân
// viên sẽ đọc đúng con số đó để báo giá qua điện thoại, nên một giá bị sửa từ trình duyệt sẽ
// thành cam kết miệng với khách.
const submit = asyncHandler(async (req, res) => {
  const { customerName, phone, email, address, note, items, website_url } = req.body;

  // Bot điền vào trường ẩn -> trả 200 giả rồi vứt đi. Báo lỗi tử tế chỉ dạy bot lần sau né.
  if (website_url) {
    return sendSuccess(res, { message: 'Đã nhận yêu cầu tư vấn.' }, null, 201);
  }

  if (!customerName?.trim() || !phone?.trim() || !address?.trim()) {
    throw new ApiError(400, 'MISSING_FIELDS', 'Vui lòng điền họ tên, số điện thoại và địa chỉ.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'EMPTY_ITEMS', 'Chưa có sản phẩm nào trong yêu cầu.');
  }

  if (items.length > MAX_ITEMS) {
    throw new ApiError(400, 'TOO_MANY_ITEMS', 'Yêu cầu có quá nhiều sản phẩm.');
  }

  const variantIds = [...new Set(items.map((i) => i.variantId).filter(Boolean))];
  if (variantIds.length === 0) {
    throw new ApiError(400, 'EMPTY_ITEMS', 'Chưa có sản phẩm nào trong yêu cầu.');
  }

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
  });

  const byId = new Map(variants.map((v) => [v.id, v]));

  // Bỏ qua dòng trỏ tới sản phẩm đã bị xoá thay vì làm hỏng cả yêu cầu: khách để trang mở vài
  // ngày rồi mới gửi là chuyện bình thường, và mất một dòng vẫn tốt hơn mất cả khách.
  const snapshot = items
    .map((raw) => {
      const variant = byId.get(raw.variantId);
      if (!variant) return null;

      const quantity = Math.min(Math.max(Number(raw.quantity) || 1, 1), 99);
      return {
        variantId: variant.id,
        sku: variant.sku,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        variantLabel: variant.variantAttributes?.label || variant.sku,
        unitPrice: variant.price,
        quantity,
        lineTotal: variant.price * quantity,
        imageUrl: variant.imageUrl || variant.product.images[0]?.url || null,
      };
    })
    .filter(Boolean);

  if (snapshot.length === 0) {
    throw new ApiError(400, 'ITEMS_UNAVAILABLE', 'Các sản phẩm trong yêu cầu không còn tồn tại.');
  }

  const created = await prisma.quoteRequest.create({
    data: {
      brandSlug: req.brand.slug,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      address: address.trim(),
      note: note?.trim() || null,
      items: snapshot,
    },
  });

  // Chỉ trả về id và mốc thời gian. Trang cảm ơn không cần đọc lại gì, và đây là endpoint công
  // khai nên trả ít nhất có thể.
  sendSuccess(res, { id: created.id, createdAt: created.createdAt }, null, 201);
});

// Danh sách cho nhân viên, mới nhất trước. Lọc theo brand để khi storefront thứ hai chạy thì
// hai bên không đọc đơn của nhau — khác với hộp thư liên hệ vốn dùng chung.
const adminList = asyncHandler(async (req, res) => {
  const { page = '1', pageSize = '20', status } = req.query;
  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = { brandSlug: req.brand.slug };
  if (status && QUOTE_STATUS[status]) where.status = status;

  const [rows, total] = await Promise.all([
    prisma.quoteRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.quoteRequest.count({ where }),
  ]);

  sendSuccess(res, rows, { page: Number(page), pageSize: take, total });
});

// Nhân viên đánh dấu đã gọi hoặc đã chốt. Kiểm tra brand trong cùng câu lệnh update để người
// của brand này không sửa được yêu cầu của brand kia.
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!QUOTE_STATUS[status]) {
    throw new ApiError(400, 'INVALID_STATUS', 'Trạng thái không hợp lệ.');
  }

  const { count } = await prisma.quoteRequest.updateMany({
    where: { id: req.params.id, brandSlug: req.brand.slug },
    data: { status },
  });
  if (count === 0) throw new ApiError(404, 'QUOTE_NOT_FOUND', 'Không tìm thấy yêu cầu.');

  sendSuccess(res, { id: req.params.id, status });
});

// Xoá hẳn, dùng để dọn spam lọt qua honeypot. Không có thùng rác và không hoàn tác được nên
// giao diện admin phải hỏi lại trước khi gọi.
const remove = asyncHandler(async (req, res) => {
  const { count } = await prisma.quoteRequest.deleteMany({
    where: { id: req.params.id, brandSlug: req.brand.slug },
  });
  if (count === 0) throw new ApiError(404, 'QUOTE_NOT_FOUND', 'Không tìm thấy yêu cầu.');

  sendSuccess(res, { message: 'Đã xoá yêu cầu.' });
});

module.exports = { submit, adminList, updateStatus, remove, QUOTE_STATUS };
