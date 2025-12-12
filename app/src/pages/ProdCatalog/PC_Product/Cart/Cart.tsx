// src/pages/ProdCatalog/Cart/Cart.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../PC_Navigation/PC_Navbar';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './Cart.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string | null;
  currency: string;
  product: {
    name: string;
    slug: string;
    main_image_url: string | null;
    base_price: string | null;
  };
}

export default function Cart() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<CartItem | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const fetchCart = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/product-catalog/cart`,
          {
            credentials: 'include',
          }
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setItems(data.items);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error('Error loading cart:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [authLoading, isLoggedIn]);

  const handleGoLogin = () => {
    navigate('/login', {
      state: { backgroundLocation: { pathname: '/cart' } },
    });
  };

  const handleGoCatalog = () => {
    navigate('/product-catalog');
  };

  const money = (amount: number, currency: string) =>
    `${currency} ${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatPrice = (amount: string | null | number, currency: string) => {
    const num =
      typeof amount === 'number'
        ? amount
        : amount
        ? Number(amount)
        : NaN;
    if (Number.isNaN(num)) return '—';
    return money(num, currency);
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const updateQuantity = async (item: CartItem, newQty: number) => {
    if (newQty <= 0) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/product-catalog/cart/items/${item.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ quantity: newQty }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, quantity: newQty } : i
          )
        );
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const handleQtyMinus = (item: CartItem) => {
    updateQuantity(item, item.quantity - 1);
  };

  const handleQtyPlus = (item: CartItem) => {
    updateQuantity(item, item.quantity + 1);
  };

  const handleDelete = async (itemId: number) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/product-catalog/cart/items/${itemId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        setSelectedIds((prev) => prev.filter((x) => x !== itemId));
        setConfirmDeleteItem(null);
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteItem) return;
    handleDelete(confirmDeleteItem.id);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteItem(null);
  };

  // 🔹 Cart → RFQ page with selected items
  const handleBulkRFQ = () => {
    const selected = selectedIds.length
      ? items.filter((i) => selectedIds.includes(i.id))
      : [];

    if (!selected.length) return;

    navigate('/rfq', {
      state: {
        source: 'cart',
        items: selected.map((item) => ({
          cart_item_id: item.id,              // 🔹 add this
          product_id: item.product_id,
          quantity: item.quantity,
          product: {
            id: item.product_id,
            name: item.product.name,
            slug: item.product.slug,
            main_image_url: item.product.main_image_url,
            base_price: item.product.base_price,
            currency: item.currency,
          },
          unit_price: item.unit_price,
          currency: item.currency,
        })),
      },
    });

  };

  // totals based only on selected items
  const { totalItems, totalPrice, currency } = useMemo(() => {
    if (!items.length || !selectedIds.length) {
      return { totalItems: 0, totalPrice: 0, currency: 'PHP' };
    }
    const selected = items.filter((i) => selectedIds.includes(i.id));
    if (!selected.length) {
      return { totalItems: 0, totalPrice: 0, currency: 'PHP' };
    }
    const totalQty = selected.reduce((sum, i) => sum + i.quantity, 0);
    const total = selected.reduce((sum, i) => {
      const unit =
        i.unit_price !== null
          ? Number(i.unit_price)
          : Number(i.product.base_price || 0);
      if (Number.isNaN(unit)) return sum;
      return sum + unit * i.quantity;
    }, 0);
    return {
      totalItems: totalQty,
      totalPrice: total,
      currency: selected[0].currency || 'PHP',
    };
  }, [items, selectedIds]);

  const hasSelection = selectedIds.length > 0;

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>My Cart</h1>

          {authLoading || loading ? (
            <div className={styles.centerBox}>
              <div className={styles.spinner} />
              <p>Loading your cart...</p>
            </div>
          ) : null}

          {!authLoading && !isLoggedIn && !loading && (
            <div className={styles.centerBox}>
              <h2 className={styles.subtitle}>
                Please log in to view your cart
              </h2>
              <p className={styles.textMuted}>
                An AxisFive account is required to add items and manage your
                orders.
              </p>
              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleGoLogin}
                >
                  Login / Register
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleGoCatalog}
                >
                  Browse products
                </button>
              </div>
            </div>
          )}

          {!authLoading &&
            isLoggedIn &&
            !loading &&
            items.length === 0 && (
              <div className={styles.centerBox}>
                <h2 className={styles.subtitle}>Your cart is empty</h2>
                <p className={styles.textMuted}>
                  Start by exploring the AxisFive product catalog and adding
                  items to your cart.
                </p>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleGoCatalog}
                >
                  Go to product catalog
                </button>
              </div>
            )}

          {!authLoading &&
            isLoggedIn &&
            !loading &&
            items.length > 0 && (
              <section className={styles.cartSection}>
                {/* header row */}
                <div className={`${styles.itemRow} ${styles.headerRow}`}>
                  <div className={styles.colProductHeader}>
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === items.length &&
                        items.length > 0
                      }
                      onChange={selectAll}
                    />
                    <span>Product</span>
                  </div>
                  <div className={styles.colUnitPrice}>Unit Price</div>
                  <div className={styles.colQty}>Quantity</div>
                  <div className={styles.colTotal}>Total Price</div>
                  <div className={styles.colActions}>Actions</div>
                </div>

                <ul className={styles.itemList}>
                  {items.map((item) => {
                    const unit =
                      item.unit_price ?? item.product.base_price ?? '0';
                    const unitNum = Number(unit) || 0;
                    const lineTotal = unitNum * item.quantity;

                    return (
                      <li key={item.id} className={styles.itemRow}>
                        {/* checkbox + product block */}
                        <div className={styles.colProduct}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelected(item.id)}
                          />
                          <div className={styles.productBlock}>
                            {item.product.main_image_url && (
                              <button
                                type="button"
                                className={styles.productName}
                                onClick={() =>
                                  navigate(
                                    `/products/${item.product.slug}`
                                  )
                                }
                              >
                                <div className={styles.thumb}>
                                  <img
                                    src={item.product.main_image_url}
                                    alt={item.product.name}
                                  />
                                </div>
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.productName}
                              onClick={() =>
                                navigate(
                                  `/products/${item.product.slug}`
                                )
                              }
                            >
                              {item.product.name}
                            </button>
                          </div>
                        </div>

                        {/* unit price */}
                        <div className={styles.colUnitPrice}>
                          {formatPrice(unit, item.currency)}
                        </div>

                        {/* quantity */}
                        <div className={styles.colQty}>
                          <div className={styles.qtyBox}>
                            <button
                              type="button"
                              onClick={() => handleQtyMinus(item)}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!Number.isNaN(val) && val >= 1) {
                                  updateQuantity(item, val);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleQtyPlus(item)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* line total */}
                        <div className={styles.colTotal}>
                          {formatPrice(lineTotal, item.currency)}
                        </div>

                        {/* actions */}
                        <div className={styles.colActions}>
                          <button
                            type="button"
                            className={styles.linkDanger}
                            onClick={() => setConfirmDeleteItem(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
        </div>
      </main>

      {/* bottom summary bar */}
      {!authLoading &&
        isLoggedIn &&
        !loading &&
        items.length > 0 && (
          <div className={styles.summaryBar}>
            <div className={styles.summaryContent}>
              <span className={styles.summaryText}>
                Total ({totalItems} item{totalItems === 1 ? '' : 's'}):
              </span>
              <div className={styles.summaryRight}>
                <span className={styles.summaryPrice}>
                  {hasSelection
                    ? money(totalPrice, currency)
                    : 'PHP 0.00'}
                </span>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={!hasSelection}
                  onClick={handleBulkRFQ}
                >
                  Request quote
                </button>
              </div>
            </div>
          </div>
        )}

      {/* delete confirmation modal */}
      {confirmDeleteItem && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Remove item?</h2>
            <p className={styles.modalText}>
              Remove <strong>{confirmDeleteItem.product.name}</strong> from
              your cart?
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleConfirmDelete}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
