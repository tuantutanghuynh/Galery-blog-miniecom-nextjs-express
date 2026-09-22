const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');

// Read and write access to the Category tree. Categories carry more weight here than the
// name suggests: each business (Gốm sứ, Petshop) is a root category and its sub-categories
// hang off it via `parentId`, so this tree is what keeps two storefronts sharing one
// database without seeing each other's content.

// Returns every category with its attribute definitions attached. The response is
// deliberately unfiltered and unpaginated — the table holds a handful of rows, and each
// frontend picks out its own branch by matching `BRAND_CATEGORY_SLUG` on the client. That
// means the list does include the other brand's categories, so any admin UI that offers a
// category picker has to filter the result before rendering it, or an editor can file
// content under the wrong business.
const list = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({ include: { attributes: true } });
  sendSuccess(res, categories);
});

// Creates a category and answers 201. Passing `parentId` makes the new row a sub-category of
// an existing one, which is how a brand's sections (Bình gốm, Tượng, Trang trí) are built;
// omitting it creates a new root, meaning a whole new business. The slug is checked first
// because it is unique in the schema and it is also the public URL segment, so a duplicate
// has to fail as a clear 409 rather than as a raw database constraint error.
const create = asyncHandler(async (req, res) => {
  const { name, slug, description, parentId } = req.body;

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw new ApiError(409, 'SLUG_TAKEN', 'Slug danh mục đã tồn tại');

  const category = await prisma.category.create({
    data: { name, slug, description, parentId: parentId || null },
  });
  sendSuccess(res, category, null, 201);
});

module.exports = { list, create };

// --- Thuộc tính của danh mục ---------------------------------------------------------
//
// Mỗi danh mục tự khai những thông số mà sản phẩm trong đó cần có (chiều cao, khối lượng,
// nhiệt độ nung...). Sản phẩm lưu giá trị vào cột JSON `attributes` theo đúng `attributeKey`
// ở đây. Tách làm hai tầng như vậy để bảng thông số trên trang sản phẩm là dữ liệu thật của
// từng món, thay vì một đoạn chữ viết cứng dùng chung cho mọi sản phẩm.

const ATTRIBUTE_TYPES = ['text', 'number'];

// Khoá sinh từ nhãn tiếng Việt: bỏ dấu, thay khoảng trắng bằng gạch dưới. Admin chỉ phải gõ
// nhãn hiển thị, không phải nghĩ ra khoá kỹ thuật và cũng không gõ sai được.
function slugifyKey(label) {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const listAttributes = asyncHandler(async (req, res) => {
  const rows = await prisma.categoryAttribute.findMany({
    where: { categoryId: req.params.id },
    orderBy: { attributeLabel: 'asc' },
  });
  sendSuccess(res, rows);
});

const createAttribute = asyncHandler(async (req, res) => {
  const { attributeLabel, attributeType = 'text' } = req.body;

  if (!attributeLabel?.trim()) {
    throw new ApiError(400, 'MISSING_LABEL', 'Vui lòng nhập tên thông số.');
  }
  if (!ATTRIBUTE_TYPES.includes(attributeType)) {
    throw new ApiError(400, 'INVALID_TYPE', 'Kiểu dữ liệu không hợp lệ.');
  }

  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục.');

  const attributeKey = slugifyKey(attributeLabel);
  if (!attributeKey) {
    throw new ApiError(400, 'INVALID_LABEL', 'Tên thông số phải có ít nhất một chữ cái hoặc số.');
  }

  const existing = await prisma.categoryAttribute.findFirst({
    where: { categoryId: req.params.id, attributeKey },
  });
  if (existing) throw new ApiError(409, 'ATTRIBUTE_EXISTS', 'Danh mục đã có thông số này.');

  const created = await prisma.categoryAttribute.create({
    data: {
      categoryId: req.params.id,
      attributeKey,
      attributeLabel: attributeLabel.trim(),
      attributeType,
    },
  });

  sendSuccess(res, created, null, 201);
});

// Xoá định nghĩa không đụng tới giá trị đã lưu trong `product.attributes`: giá trị cũ nằm im
// trong JSON và chỉ thôi được hiển thị. Nếu admin khai lại đúng tên đó thì dữ liệu cũ hiện
// lại nguyên vẹn, nên một lần bấm nhầm không làm mất số liệu của hàng trăm sản phẩm.
const removeAttribute = asyncHandler(async (req, res) => {
  const { count } = await prisma.categoryAttribute.deleteMany({
    where: { id: req.params.attributeId, categoryId: req.params.id },
  });
  if (count === 0) throw new ApiError(404, 'ATTRIBUTE_NOT_FOUND', 'Không tìm thấy thông số.');

  sendSuccess(res, { message: 'Đã xoá thông số.' });
});

module.exports.listAttributes = listAttributes;
module.exports.createAttribute = createAttribute;
module.exports.removeAttribute = removeAttribute;
