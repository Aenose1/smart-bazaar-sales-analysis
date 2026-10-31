import React from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  BarChart3, 
  ShoppingBag, 
  TrendingUp, 
  Database, 
  Lightbulb, 
  Info,
  Store
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Dataset', icon: Upload },
  { id: 'dashboard', label: 'Sales Dashboard', icon: BarChart3 },
  { id: 'product', label: 'Product Analysis', icon: ShoppingBag },
  { id: 'forecast', label: 'Sales Forecast', icon: TrendingUp },
  { id: 'explorer', label: 'Data Explorer', icon: Database },
  { id: 'insights', label: 'Insights & Recommendations', icon: Lightbulb },
  { id: 'about', label: 'About Project', icon: Info },
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <Store size={22} />
        </div>
        <div>
          <div className="brand-title">SMART BAZAAR</div>
          <div className="brand-sub">Sales Analytics & Forecast</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
