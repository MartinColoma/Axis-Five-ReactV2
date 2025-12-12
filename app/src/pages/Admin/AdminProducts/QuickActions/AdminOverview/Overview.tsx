// src/pages/Admin/Overview/Overview.tsx
import React, { useEffect, useMemo, useState } from 'react';
import styles from './Overview.module.css';

interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  category: string | null;
  pricing_model: 'one_time_hardware' | 'hardware_plus_subscription' | 'subscription_only';
  stock_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order';
  is_iot_connected: boolean;
  requires_subscription: boolean;
  main_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

type SortColumn = 'name' | 'sku' | 'stock_quantity' | 'stock_status' | 'created_at';
type SortDirection = 'asc' | 'desc';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const AdminOverview: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);

  // edit modal state
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    sku: string;
    category: string;
    stock_quantity: string;
    stock_status: Product['stock_status'];
    is_active: boolean;
    main_image_url: string;
    short_description: string;
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.products)) {
        const normalized: Product[] = data.products.map((p: any) => ({
          ...p,
          is_active: typeof p.is_active === 'boolean' ? p.is_active : true,
          main_image_url: p.main_image_url ?? null,
          category: p.category ?? null,
        }));
        setProducts(normalized);
      } else {
        showNotification('error', data.message || 'Failed to fetch products');
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      showNotification('error', 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredProducts = useMemo(() => {
    const search = searchTerm.toLowerCase();
    let filtered = products.filter((p) => {
      return (
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        (p.category || '').toLowerCase().includes(search)
      );
    });

    filtered = filtered.sort((a, b) => {
      let aVal: any = a[sortColumn];
      let bVal: any = b[sortColumn];

      if (sortColumn === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, sortColumn, sortDirection]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const productStatusLabel = (p: Product) =>
    p.is_active ? 'Active' : 'Unlisted';

  const productStatusClass = (p: Product) =>
    p.is_active ? styles.statusActive : styles.statusInactive;

  const stockStatusLabel = (p: Product) =>
    p.stock_status.replace(/_/g, ' ');

  const stockStatusClass = (p: Product) => {
    switch (p.stock_status) {
      case 'in_stock':
        return styles.statusActive;
      case 'low_stock':
        return styles.statusWarning;
      case 'out_of_stock':
        return styles.statusInactive;
      case 'made_to_order':
      default:
        return styles.statusInfo;
    }
  };

  const updateProductActive = async (product: Product, is_active: boolean) => {
    setUpdating(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/products/${product.id}/active`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        showNotification('error', data.message || 'Failed to update product');
        return;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active } : p))
      );
      showNotification(
        'success',
        `${product.sku} is now ${is_active ? 'Active' : 'Unlisted'}`
      );
    } catch (err) {
      console.error('Error updating product status:', err);
      showNotification('error', 'Failed to update product');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelUnlist = () => setConfirmProduct(null);

  // ====== EDIT MODAL LOGIC ======

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setEditForm({
      name: product.name,
      sku: product.sku,
      category: product.category || '',
      stock_quantity: String(product.stock_quantity),
      stock_status: product.stock_status,
      is_active: product.is_active,
      main_image_url: product.main_image_url || '',
      short_description: (product as any).short_description || '',
    });
  };

  const closeEditModal = () => {
    setEditProduct(null);
    setEditForm(null);
  };

const handleEditChange = (
  e: React.ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >
) => {
  if (!editForm) return;

  const target = e.target;
  const { name, value } = target;

  let nextValue: string | boolean = value;

  if (target instanceof HTMLInputElement && target.type === 'checkbox') {
    nextValue = target.checked;
  } else if (name === 'stock_quantity') {
    nextValue = value.replace(/[^\d]/g, '');
  }

  setEditForm((prev) =>
    prev
      ? {
          ...prev,
          [name]: nextValue,
        }
      : prev
  );
};


  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct || !editForm) return;

    setUpdating(true);
    try {
      const payload: any = {
        name: editForm.name.trim(),
        sku: editForm.sku.trim(),
        category: editForm.category.trim() || null,
        stock_quantity: Number(editForm.stock_quantity) || 0,
        stock_status: editForm.stock_status,
        is_active: editForm.is_active,
        main_image_url: editForm.main_image_url.trim() || null,
        short_description: editForm.short_description.trim() || null,
      };

      const res = await fetch(
        `${API_BASE_URL}/api/admin/products/${editProduct.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        showNotification('error', data.message || 'Failed to update product');
        return;
      }

      const updated: Product = data.product;
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
      showNotification('success', `${updated.sku} updated`);
      closeEditModal();
    } catch (err) {
      console.error('Error updating product:', err);
      showNotification('error', 'Failed to update product');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <section
        className={`${styles.tabPane} ${styles.active}`}
        aria-label="Products overview"
      >
        <div className={styles.tableControls}>
          <div className={styles.tableHeader}>
            <h5>
              <i className="fas fa-box" /> Products
            </h5>
            <span className={styles.userCount}>
              {filteredProducts.length} Total Products
            </span>
          </div>

          <div className={styles.searchBarWrapper}>
            <div className={styles.searchBar}>
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search products"
              />
              {searchTerm && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear product search"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles.centerBox}>
            <div className={styles.spinner} />
            <p>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.centerBox}>
            <h2 className={styles.subtitle}>No products found</h2>
            <p className={styles.textMuted}>
              Add products from the admin panel to see them here.
            </p>
          </div>
        ) : (
          <section className={styles.cartSection}>
            <div className={`${styles.itemRow} ${styles.headerRow}`}>
              <div className={styles.colProductHeader}>
                <button
                  type="button"
                  className={styles.headerSortButton}
                  onClick={() => handleSort('name')}
                >
                  Product
                </button>
              </div>
              <button
                type="button"
                className={styles.colSmallHeader}
                onClick={() => handleSort('stock_quantity')}
              >
                Stock Qty
              </button>
              <button
                type="button"
                className={styles.colSmallHeader}
                onClick={() => handleSort('stock_status')}
              >
                Stock Status
              </button>
              <button
                type="button"
                className={styles.colSmallHeader}
                onClick={() => handleSort('created_at')}
              >
                Created
              </button>
              <div className={styles.colSmallHeader}>Product Status</div>
              <div className={styles.colActions}>Actions</div>
            </div>

            <ul className={styles.itemList}>
              {filteredProducts.map((p) => (
                <li key={p.id} className={styles.itemRow}>
                  <div className={styles.colProduct}>
                    <div className={styles.productBlock}>
                      {p.main_image_url && (
                        <div className={styles.thumb}>
                          <img src={p.main_image_url} alt={p.name} />
                        </div>
                      )}
                      <div className={styles.productMeta}>
                        <div className={styles.productNameRow}>
                          <span className={styles.productName}>{p.name}</span>
                        </div>
                        <div className={styles.productSubRow}>
                          <span className={styles.productSku}>
                            SKU: {p.sku}
                          </span>
                          {p.category && (
                            <span className={styles.productCategory}>
                              • {p.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.colUnitPrice}>
                    {p.stock_quantity}
                  </div>

                  <div className={styles.colQty}>
                    <span
                      className={`${styles.statusBadge} ${stockStatusClass(p)}`}
                    >
                      {stockStatusLabel(p)}
                    </span>
                  </div>

                  <div className={styles.colTotal}>
                    {formatDate(p.created_at)}
                  </div>

                  <div className={styles.colTotal}>
                    <span
                      className={`${styles.statusBadge} ${productStatusClass(p)}`}
                    >
                      {productStatusLabel(p)}
                    </span>
                  </div>

                  <div className={styles.colActions}>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      onClick={() => openEditModal(p)}
                    >
                      <i className="fas fa-edit" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => setConfirmProduct(p)}
                      disabled={updating}
                    >
                      <i className={p.is_active ? 'fas fa-eye-slash' : 'fas fa-eye'} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>

      {notification && (
        <div
          className={`${styles.notification} ${
            styles[
              `notification${
                notification.type.charAt(0).toUpperCase() +
                notification.type.slice(1)
              }` as 'notificationSuccess' | 'notificationError'
            ]
          } ${styles.show}`}
        >
          <i
            className={`fas ${
              notification.type === 'success'
                ? 'fa-check-circle'
                : 'fa-exclamation-circle'
            }`}
          />
          <span>{notification.message}</span>
          <button
            type="button"
            className={styles.notificationClose}
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {confirmProduct && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalDialog}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={`${styles.modalTitle} ${styles.dangerTitle}`}>
                  {confirmProduct.is_active ? 'Unlist product?' : 'Activate product?'}
                </h2>
                <button
                  type="button"
                  className={styles.btnClose}
                  onClick={handleCancelUnlist}
                  aria-label="Close"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>
                  {confirmProduct.is_active
                    ? 'This will hide the product from the public catalog.'
                    : 'This will make the product visible in the public catalog again.'}
                </p>
                <p>
                  <strong>{confirmProduct.name}</strong> (SKU{' '}
                  <strong>{confirmProduct.sku}</strong>)
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleCancelUnlist}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={() =>
                    updateProductActive(
                      confirmProduct,
                      !confirmProduct.is_active
                    ).then(() => setConfirmProduct(null))
                  }
                  disabled={updating}
                >
                  {confirmProduct.is_active ? 'Unlist' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editProduct && editForm && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalDialog}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Edit product</h2>
                <button
                  type="button"
                  className={styles.btnClose}
                  onClick={closeEditModal}
                  aria-label="Close"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit-name">Name</label>
                    <input
                      id="edit-name"
                      name="name"
                      type="text"
                      value={editForm.name}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit-sku">SKU</label>
                    <input
                      id="edit-sku"
                      name="sku"
                      type="text"
                      value={editForm.sku}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit-category">Category</label>
                    <input
                      id="edit-category"
                      name="category"
                      type="text"
                      value={editForm.category}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit-stock-qty">Stock quantity</label>
                    <input
                      id="edit-stock-qty"
                      name="stock_quantity"
                      type="text"
                      inputMode="numeric"
                      value={editForm.stock_quantity}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit-stock-status">Stock status</label>
                    <select
                      id="edit-stock-status"
                      name="stock_status"
                      value={editForm.stock_status}
                      onChange={handleEditChange}
                    >
                      <option value="in_stock">In stock</option>
                      <option value="low_stock">Low stock</option>
                      <option value="out_of_stock">Out of stock</option>
                      <option value="made_to_order">Made to order</option>
                    </select>
                  </div>
                  <div className={styles.formGroupCheckbox}>
                    <label htmlFor="edit-is-active">
                      <input
                        id="edit-is-active"
                        name="is_active"
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={handleEditChange}
                      />
                      Active
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit-main-image">Main image URL</label>
                    <input
                      id="edit-main-image"
                      name="main_image_url"
                      type="text"
                      value={editForm.main_image_url}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit-short-desc">Short description</label>
                    <textarea
                      id="edit-short-desc"
                      name="short_description"
                      rows={3}
                      value={editForm.short_description}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={updating}
                  >
                    {updating ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <i className="fas fa-spinner fa-spin" /> Loading...
          </div>
        </div>
      )}
    </>
  );
};

export default AdminOverview;
