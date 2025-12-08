// AdminHome.tsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import styles from './AdminProd.module.css';
import Navbar from '../../ProdCatalog/PC_Navigation/PC_Navbar';
import Footer from '../../Landing/Navigation/Footer';
import AdminOverview from './QuickActions/AdminOverview/Overview';
import AdminAddProd from './QuickActions/AdminAddProd/AddProd';
import usePageMeta from '../../../hooks/usePageMeta';

type ActiveTab = 'overview' | 'create-account' | 'add-product';

const AdminHome = () => {
  const location = useLocation();
  const navigate = useNavigate();
  usePageMeta("AxisFive Store - Products", "/images/Logos/A5_Logo1.png");

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          const navbarHeight = 70;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />

      <section className={styles.sectionPadding}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Product Management</h2>

          <div className={styles.quickActionsPanel}>
            <div className={styles.tabHeader}>
              <h4 className={styles.panelTitle}>Quick Actions</h4>
              <div className={styles.tabButtons}>
                <button
                  className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.active : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <i className="fas fa-chart-bar"></i>Overview
                </button>
                <button
                  className={`${styles.tabBtn} ${activeTab === 'add-product' ? styles.active : ''}`}
                  onClick={() => setActiveTab('add-product')}
                >
                  <i className="fas fa-box-open"></i>Add New Product
                </button>
              </div>
            </div>

            <div className={styles.tabContentWrapper}>
              {activeTab === 'overview' && <AdminOverview />}
              {activeTab === 'add-product' && <AdminAddProd />}
            </div>
          </div>
        </div>
      </section>

      <Footer onScrollToSection={scrollToSection} />
    </div>
  );
};

export default AdminHome;
