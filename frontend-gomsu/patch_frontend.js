const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'app/admin/products/[id]/edit/page.js');
let code = fs.readFileSync(pagePath, 'utf8');

// 1. Add new state for the new variant form
code = code.replace(
  'const [images, setImages] = useState([]);',
  `const [images, setImages] = useState([]);
  const [newVariant, setNewVariant] = useState({ sku: '', label: '', price: 0, stockQuantity: 0 });
  const [addingVariant, setAddingVariant] = useState(false);`
);

// 2. Add handlers
const handlers = `
  async function handleAddVariant(e) {
    e.preventDefault();
    setAddingVariant(true);
    try {
      const res = await authFetch(\`/products/\${id}/variants\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVariant),
      });
      // Map the returned variant to match the UI format
      const added = { ...res.data, label: res.data.variantAttributes?.label || '' };
      setVariants([...variants, added]);
      setNewVariant({ sku: '', label: '', price: 0, stockQuantity: 0 });
    } catch (err) {
      alert('Lỗi thêm biến thể: ' + err.message);
    } finally {
      setAddingVariant(false);
    }
  }

  async function handleDeleteVariant(variant) {
    if (variants.length <= 1) {
      alert('Không thể xóa. Sản phẩm phải có ít nhất một biến thể.');
      return;
    }
    if (!confirm(\`Xóa biến thể \${variant.sku}?\`)) return;
    
    try {
      await authFetch(\`/products/variants/\${variant.id}\`, { method: 'DELETE' });
      setVariants(variants.filter((v) => v.id !== variant.id));
    } catch (err) {
      alert('Lỗi xóa biến thể: ' + err.message);
    }
  }
`;

code = code.replace('async function handleSaveVariant(variant) {', handlers + '\n  async function handleSaveVariant(variant) {');

// 3. Update the variants UI section
const variantsUI = `
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col gap-4 mb-8">
        <h2 className="font-serif text-xl text-gray-900">Giá &amp; tồn kho</h2>

        {variants.map((v, i) => (
          <div key={v.id} className="border border-gray-200 rounded p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50/50 relative group">
            <div className="md:col-span-3">
              <label className={labelCls}>Tên phiên bản</label>
              <input
                value={v.label}
                onChange={(e) => setVariants((prev) => prev.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>SKU</label>
              <input value={v.sku} disabled className={inputCls + ' font-mono text-xs bg-gray-100 text-gray-500'} title="SKU không đổi được sau khi tạo" />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Giá (VNĐ)</label>
              <input
                type="number" min="0" step="1000" value={v.price}
                onChange={(e) => setVariants((prev) => prev.map((x, idx) => (idx === i ? { ...x, price: e.target.value } : x)))}
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Tồn kho</label>
              <input
                type="number" min={v.reservedQuantity} value={v.stockQuantity}
                onChange={(e) => setVariants((prev) => prev.map((x, idx) => (idx === i ? { ...x, stockQuantity: e.target.value } : x)))}
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleDeleteVariant(v)}
                className="border border-transparent text-red-600 px-3 py-2.5 text-xs font-medium hover:bg-red-50 transition-colors rounded"
                title="Xóa biến thể này"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={() => handleSaveVariant(v)}
                disabled={savingVariant === v.id}
                className="border border-black text-black px-4 py-2.5 text-xs uppercase tracking-wider font-medium hover:bg-black hover:text-white transition-colors rounded disabled:opacity-50"
              >
                {savingVariant === v.id ? 'Đang lưu' : 'Lưu'}
              </button>
            </div>
            {v.reservedQuantity > 0 && (
              <p className="md:col-span-12 text-xs text-amber-600 -mt-1">
                Đang giữ {v.reservedQuantity} cho đơn chờ thanh toán — không thể đặt tồn kho thấp hơn số này.
              </p>
            )}
          </div>
        ))}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Thêm biến thể mới</h3>
          <form onSubmit={handleAddVariant} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-blue-50/30 p-4 border border-blue-100 rounded">
            <div className="md:col-span-3">
              <label className={labelCls}>Tên phiên bản</label>
              <input required value={newVariant.label} onChange={e => setNewVariant({...newVariant, label: e.target.value})} className={inputCls} placeholder="VD: Đen - Size M" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>SKU mới</label>
              <input required value={newVariant.sku} onChange={e => setNewVariant({...newVariant, sku: e.target.value})} className={inputCls + ' font-mono text-xs'} placeholder="Mã duy nhất" />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Giá (VNĐ)</label>
              <input required type="number" min="0" step="1000" value={newVariant.price} onChange={e => setNewVariant({...newVariant, price: parseInt(e.target.value) || 0})} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Tồn kho</label>
              <input required type="number" min="0" value={newVariant.stockQuantity} onChange={e => setNewVariant({...newVariant, stockQuantity: parseInt(e.target.value) || 0})} className={inputCls} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={addingVariant} className="bg-blue-600 text-white px-4 py-2.5 text-xs uppercase tracking-wider font-medium hover:bg-blue-700 transition-colors rounded disabled:opacity-50">
                {addingVariant ? '...' : '+ Thêm'}
              </button>
            </div>
          </form>
        </div>
      </section>
`;

code = code.replace(/<section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col gap-4 mb-8">[\s\S]*?<\/section>/, variantsUI);

fs.writeFileSync(pagePath, code);
console.log('Frontend page patched');
