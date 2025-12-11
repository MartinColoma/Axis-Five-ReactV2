import React, { useMemo, useState, useEffect } from 'react';
import styles from './Overview.module.css';

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  pricing_model: 'one_time_hardware' | 'hardware_plus_subscription' | 'subscription_only';
  stock_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order';
  requires_subscription: boolean;
  is_iot_connected: boolean;
  created_at: string;
}

type ProductSortColumn =
  | 'sku'
  | 'name'
  | 'category'
  | 'pricing_model'
  | 'stock_quantity'
  | 'stock_status'
  | 'created_at';

type SortDirection = 'asc' | 'desc';

const API_BASE_URL = import.meta.env.VITE_API_LOCAL_SERVER as string; //VITE_API_LOCAL_SERVER //VITE_API_BASE_URL

const AdminOverview: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSortColumn, setProductSortColumn] = useState<ProductSortColumn | null>(null);
  const [productSortDirection, setProductSortDirection] = useState<SortDirection>('asc');

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

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
      const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        showNotification('error', data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('error', 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSort = (column: ProductSortColumn) => {
    if (productSortColumn === column) {
      setProductSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setProductSortColumn(column);
      setProductSortDirection('asc');
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    const search = productSearchTerm.toLowerCase();

    let filtered = products.filter((p) => {
      return (
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        (p.category || '').toLowerCase().includes(search)
      );
    });

    if (productSortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[productSortColumn];
        let bValue: any = b[productSortColumn];

        if (productSortColumn === 'created_at') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) return productSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return productSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [products, productSearchTerm, productSortColumn, productSortDirection]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProductSortIcon = (column: ProductSortColumn) => {
    if (productSortColumn !== column) return 'fa-sort';
    return productSortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  };

  return (
    <>
      <section className={`${styles.tabPane} ${styles.active}`} aria-label="Overview">
        {/* PRODUCTS TABLE */}
        <div className={styles.tableControls}>
          <div className={styles.tableHeader}>
            <h5>
              <i className="fas fa-box" /> Products
            </h5>
            <span className={styles.userCount}>
              {filteredAndSortedProducts.length} Total Products
            </span>
          </div>

          <div className={styles.searchBarWrapper}>
            <div className={styles.searchBar}>
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or category..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                aria-label="Search products"
              />
              {productSearchTerm && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => setProductSearchTerm('')}
                  aria-label="Clear product search"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th onClick={() => handleProductSort('sku')}>
                  SKU <i className={`fas ${getProductSortIcon('sku')} ${styles.sortIcon}`} />
                </th>
                <th onClick={() => handleProductSort('name')}>
                  Product Name{' '}
                  <i className={`fas ${getProductSortIcon('name')} ${styles.sortIcon}`} />
                </th>
                <th onClick={() => handleProductSort('category')}>
                  Category{' '}
                  <i className={`fas ${getProductSortIcon('category')} ${styles.sortIcon}`} />
                </th>
                <th onClick={() => handleProductSort('pricing_model')}>
                  Pricing Model{' '}
                  <i
                    className={`fas ${getProductSortIcon('pricing_model')} ${styles.sortIcon}`}
                  />
                </th>
                <th onClick={() => handleProductSort('stock_quantity')}>
                  Stock{' '}
                  <i
                    className={`fas ${getProductSortIcon('stock_quantity')} ${styles.sortIcon}`}
                  />
                </th>
                <th onClick={() => handleProductSort('stock_status')}>
                  Stock Status{' '}
                  <i
                    className={`fas ${getProductSortIcon('stock_status')} ${styles.sortIcon}`}
                  />
                </th>
                <th onClick={() => handleProductSort('created_at')}>
                  Created At{' '}
                  <i className={`fas ${getProductSortIcon('created_at')} ${styles.sortIcon}`} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProducts.length === 0 ? (
                <tr className={styles.noResults}>
                  <td colSpan={7}>No products found</td>
                </tr>
              ) : (
                filteredAndSortedProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className={styles.userIdBadge}>{p.sku}</span>
                    </td>
                    <td>{p.name}</td>
                    <td>{p.category || '-'}</td>
                    <td>{p.pricing_model.replace(/_/g, ' ')}</td>
                    <td>{p.stock_quantity}</td>
                    <td>{p.stock_status.replace(/_/g, ' ')}</td>
                    <td>{formatDate(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Notification */}
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
              notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'
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
