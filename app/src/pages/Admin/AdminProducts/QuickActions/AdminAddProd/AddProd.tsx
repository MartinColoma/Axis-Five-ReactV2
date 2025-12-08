// QuickActions/AdminAddProd/AdminAddProd.tsx
import React, { useState } from 'react';
import styles from './AddProd.module.css';

interface ProductFormData {
  sku: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  brand: string;

  pricing_model: 'one_time_hardware' | 'hardware_plus_subscription' | 'subscription_only';
  base_price: string;       // keep as string in form, convert to number on submit
  currency: string;

  is_iot_connected: boolean;
  requires_subscription: boolean;

  stock_quantity: string;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order';
  lead_time_days: string;
  min_order_qty: string;

  main_image_url: string;
}

const API_BASE_URL = import.meta.env.VITE_API_LOCAL_SERVER as string;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const AdminAddProd: React.FC = () => {
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    slug: '',
    short_description: '',
    description: '',
    category: '',
    brand: '',
    pricing_model: 'hardware_plus_subscription',
    base_price: '',
    currency: 'PHP',
    is_iot_connected: true,
    requires_subscription: false,
    stock_quantity: '0',
    stock_status: 'in_stock',
    lead_time_days: '',
    min_order_qty: '1',
    main_image_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name, value } = target;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: target.checked,
      }));
      return;
    }

    // Auto-generate slug from name if appropriate
    if (name === 'name') {
      setFormData(prev => {
        const newName = value;
        const currentSlug = prev.slug;
        const autoSlug = slugify(newName);
        const shouldUpdateSlug =
          !currentSlug || currentSlug === slugify(prev.name);

        return {
          ...prev,
          name: newName,
          slug: shouldUpdateSlug ? autoSlug : currentSlug,
        };
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setFormData({
      sku: '',
      name: '',
      slug: '',
      short_description: '',
      description: '',
      category: '',
      brand: '',
      pricing_model: 'hardware_plus_subscription',
      base_price: '',
      currency: 'PHP',
      is_iot_connected: true,
      requires_subscription: false,
      stock_quantity: '0',
      stock_status: 'in_stock',
      lead_time_days: '',
      min_order_qty: '1',
      main_image_url: '',
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sku || !formData.name || !formData.slug || !formData.category) {
      showNotification('error', 'SKU, Name, Slug, and Category are required!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        sku: formData.sku,
        name: formData.name,
        slug: formData.slug,
        short_description: formData.short_description || null,
        description: formData.description || null,
        category: formData.category || null,
        brand: formData.brand || null,
        pricing_model: formData.pricing_model,
        base_price: formData.base_price ? Number(formData.base_price) : null,
        currency: formData.currency || 'PHP',
        is_iot_connected: formData.is_iot_connected,
        requires_subscription: formData.requires_subscription,
        stock_quantity: Number(formData.stock_quantity || '0'),
        stock_status: formData.stock_status,
        lead_time_days: formData.lead_time_days ? Number(formData.lead_time_days) : null,
        min_order_qty: Number(formData.min_order_qty || '1'),
        main_image_url: formData.main_image_url || null,
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/add-product`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        showNotification('success', 'Product created successfully!');
        handleReset();
      } else {
        showNotification('error', data.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showNotification('error', 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <i className="fas fa-spinner fa-spin" /> Creating product...
          </div>
        </div>
      )}

      <section className={`${styles.tabPane} ${styles.active}`} aria-label="Create new product">
        <div className={styles.formHeader}>
          <h5>
            <i className="fas fa-box-open" /> Add New Product
          </h5>
        </div>

        <div className={styles.formLayout}>
          {/* Left: form */}
          <div className={styles.formColumn}>
            <form onSubmit={handleCreateProduct} className={styles.userForm}>
              <div className={styles.formRow}>
                {/* Basic info */}
                <div className={styles.colMd6}>
                  <label className={styles.formLabel} htmlFor="sku">
                    SKU:
                  </label>
                  <input
                    id="sku"
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    placeholder="Unique SKU"
                    required
                  />
                </div>

                <div className={styles.colMd6}>
                  <label className={styles.formLabel} htmlFor="name">
                    Product Name:
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    placeholder="Product name"
                    required
                  />
                </div>

                <div className={styles.colMd6}>
                  <label className={styles.formLabel} htmlFor="slug">
                    Slug (URL key):
                  </label>
                  <input
                    id="slug"
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    placeholder="e.g. patrol-security-robot"
                    required
                  />
                </div>

                <div className={styles.colMd6}>
                  <label className={styles.formLabel} htmlFor="category">
                    Category:
                  </label>
                  <input
                    id="category"
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    placeholder="e.g. Security Robots"
                    required
                  />
                </div>

                <div className={styles.colMd6}>
                  <label className={styles.formLabel} htmlFor="brand">
                    Brand:
                  </label>
                  <input
                    id="brand"
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    placeholder="Brand / Manufacturer"
                  />
                </div>

                <div className={styles.col12}>
                  <label className={styles.formLabel} htmlFor="short_description">
                    Short Description:
                  </label>
                  <input
                    id="short_description"
                    type="text"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    placeholder="Short summary for product cards"
                  />
                </div>

                <div className={styles.col12}>
                  <label className={styles.formLabel} htmlFor="description">
                    Full Description:
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    placeholder="Detailed description, specs, etc."
                    rows={4}
                  />
                </div>

                {/* Pricing model */}
                <div className={styles.colMd6}>
                  <label className={styles.formLabel} htmlFor="pricing_model">
                    Pricing Model:
                  </label>
                  <select
                    id="pricing_model"
                    name="pricing_model"
                    value={formData.pricing_model}
                    onChange={handleInputChange}
                    className={styles.formControl}
                  >
                    <option value="one_time_hardware">One-time hardware</option>
                    <option value="hardware_plus_subscription">Hardware + subscription</option>
                    <option value="subscription_only">Subscription only</option>
                  </select>
                </div>

                <div className={styles.colMd3}>
                  <label className={styles.formLabel} htmlFor="base_price">
                    Base Price (optional):
                  </label>
                  <input
                    id="base_price"
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    placeholder="e.g. 15000"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className={styles.colMd3}>
                  <label className={styles.formLabel} htmlFor="currency">
                    Currency:
                  </label>
                  <input
                    id="currency"
                    type="text"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    placeholder="PHP"
                  />
                </div>

                {/* IoT flags */}
                <div className={styles.colMd6}>
                  <label className={styles.formLabel}>IoT & Subscription:</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        name="is_iot_connected"
                        checked={formData.is_iot_connected}
                        onChange={handleInputChange}
                      />
                      <span>IoT Connected</span>
                    </label>
                    <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        name="requires_subscription"
                        checked={formData.requires_subscription}
                        onChange={handleInputChange}
                      />
                      <span>Requires Subscription</span>
                    </label>
                  </div>
                </div>

                {/* Inventory */}
                <div className={styles.colMd3}>
                  <label className={styles.formLabel} htmlFor="stock_quantity">
                    Stock Quantity:
                  </label>
                  <input
                    id="stock_quantity"
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    min="0"
                  />
                </div>

                <div className={styles.colMd3}>
                  <label className={styles.formLabel} htmlFor="stock_status">
                    Stock Status:
                  </label>
                  <select
                    id="stock_status"
                    name="stock_status"
                    value={formData.stock_status}
                    onChange={handleInputChange}
                    className={styles.formControl}
                  >
                    <option value="in_stock">In stock</option>
                    <option value="low_stock">Low stock</option>
                    <option value="out_of_stock">Out of stock</option>
                    <option value="made_to_order">Made to order</option>
                  </select>
                </div>

                <div className={styles.colMd3}>
                  <label className={styles.formLabel} htmlFor="lead_time_days">
                    Lead Time (days):
                  </label>
                  <input
                    id="lead_time_days"
                    type="number"
                    name="lead_time_days"
                    value={formData.lead_time_days}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    min="0"
                  />
                </div>

                <div className={styles.colMd3}>
                  <label className={styles.formLabel} htmlFor="min_order_qty">
                    Min Order Qty:
                  </label>
                  <input
                    id="min_order_qty"
                    type="number"
                    name="min_order_qty"
                    value={formData.min_order_qty}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    min="1"
                  />
                </div>

                {/* Media */}
                <div className={styles.col12}>
                  <label className={styles.formLabel} htmlFor="main_image_url">
                    Main Image URL:
                  </label>
                  <input
                    id="main_image_url"
                    type="text"
                    name="main_image_url"
                    value={formData.main_image_url}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    placeholder="https://..."
                  />
                </div>

                {/* Actions */}
                <div className={styles.col12}>
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleReset}
                      disabled={loading}
                    >
                      <i className="fas fa-redo" /> Clear All Fields
                    </button>
                    <button
                      type="submit"
                      className={styles.btnPrimary}
                      disabled={loading}
                    >
                      <i className="fas fa-box-check" /> Create Product
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right: simple preview */}
          <aside className={styles.previewColumn} aria-label="Product preview">
            <div className={styles.accountPreviewPanel}>
              <div className={styles.previewHeader}>
                <h5>
                  <i className="fas fa-eye" /> Product Preview
                </h5>
              </div>
              <div className={styles.previewContent}>
                <div className={styles.previewItem}>
                  <label>Product Name:</label>
                  <span
                    className={`${styles.previewValue} ${
                      formData.name ? styles.hasValue : ''
                    }`}
                  >
                    {formData.name || 'New Product'}
                  </span>
                </div>

                <div className={styles.previewItem}>
                  <label>SKU:</label>
                  <span
                    className={`${styles.previewValue} ${
                      formData.sku ? styles.hasValue : ''
                    }`}
                  >
                    {formData.sku || '-'}
                  </span>
                </div>

                <div className={styles.previewItem}>
                  <label>Category:</label>
                  <span
                    className={`${styles.previewValue} ${
                      formData.category ? styles.hasValue : ''
                    }`}
                  >
                    {formData.category || '-'}
                  </span>
                </div>

                <div className={styles.previewItem}>
                  <label>Pricing Model:</label>
                  <span className={`${styles.previewValue} ${styles.hasValue}`}>
                    {formData.pricing_model.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className={styles.previewItem}>
                  <label>Base Price:</label>
                  <span className={`${styles.previewValue} ${styles.hasValue}`}>
                    {formData.base_price
                      ? `${formData.currency} ${formData.base_price}`
                      : 'Not set'}
                  </span>
                </div>

                <div className={styles.previewItem}>
                  <label>IoT Flags:</label>
                  <span className={`${styles.previewValue} ${styles.hasValue}`}>
                    {formData.is_iot_connected ? 'IoT Connected' : 'Not IoT'} ·{' '}
                    {formData.requires_subscription ? 'Subscription required' : 'No subscription'}
                  </span>
                </div>

                <div className={styles.previewItem}>
                  <label>Stock:</label>
                  <span className={`${styles.previewValue} ${styles.hasValue}`}>
                    {`${formData.stock_quantity} (${formData.stock_status.replace(/_/g, ' ')})`}
                  </span>
                </div>

                <div className={styles.previewItem}>
                  <label>Lead Time & MOQ:</label>
                  <span className={`${styles.previewValue} ${styles.hasValue}`}>
                    {`Lead time: ${
                      formData.lead_time_days || 'N/A'
                    } days · Min Qty: ${formData.min_order_qty}`}
                  </span>
                </div>

                <div className={styles.previewNote}>
                  <i className="fas fa-info-circle" />
                  <small>
                    This preview helps check key product details before saving. All fields can be
                    edited later from the product management screen.
                  </small>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {notification && (
        <div
          className={`${styles.notification} ${
            styles[
              `notification${
                notification.type.charAt(0).toUpperCase() + notification.type.slice(1)
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
    </>
  );
};

export default AdminAddProd;
