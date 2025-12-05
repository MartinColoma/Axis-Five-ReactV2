import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import styles from './AdminHome.module.css';
import Navbar from '../../ProdCatalog/PC_Navigation/PC_Navbar';
import Footer from '../../Landing/Navigation/Footer';
import AdminOverview from './QuickActions/AdminOverview/AdminOverview';
import AdminCreateAcc from './QuickActions/AdminCreateAcc/AdminCreateAcc';
import AdminArchivedUsers from './QuickActions/AdminArchivedUsers/AdminArchivedUsers';

type ActiveTab = 'overview' | 'create-account' | 'archived-users';

const AdminHome = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
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
          <h2 className={styles.sectionTitle}>Administrator Dashboard</h2>

          {/* Quick Actions Panel */}
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
                  className={`${styles.tabBtn} ${activeTab === 'create-account' ? styles.active : ''}`}
                  onClick={() => setActiveTab('create-account')}
                >
                  <i className="fas fa-user-plus"></i>Create New Account
                </button>
                <button
                  className={`${styles.tabBtn} ${activeTab === 'archived-users' ? styles.active : ''}`}
                  onClick={() => setActiveTab('archived-users')}
                >
                  <i className="fas fa-archive"></i>Archived Users
                </button>
              </div>
            </div>

            <div className={styles.tabContentWrapper}>
              {activeTab === 'overview' && <AdminOverview />}
              {activeTab === 'create-account' && <AdminCreateAcc />}
              {activeTab === 'archived-users' && <AdminArchivedUsers />}
            </div>
          </div>
        </div>
      </section>

      <Footer onScrollToSection={scrollToSection} />
    </div>
  );
};

export default AdminHome;
