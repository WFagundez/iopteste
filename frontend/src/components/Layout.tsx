import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Menu, Bell, ChevronDown, LayoutDashboard, ListChecks, FileText } from 'lucide-react';

const menuItems = [
  { section: 'Principal', items: [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard }
  ]},
  { section: 'Coleta de dados', items: [
    { path: '/items', label: 'Cadastro de item', icon: ListChecks },
    { path: '/formularios', label: 'Formulários', icon: FileText }
  ]}
];

function getBreadcrumb(path: string) {
  if (path === '/') return [{ label: 'Início', path: '/' }, { label: 'Dashboard', path: '/' }];
  if (path === '/items') return [{ label: 'Início', path: '/' }, { label: 'Coleta de dados', path: '#' }, { label: 'Cadastro de item', path: '/items' }];
  if (path === '/formularios') return [{ label: 'Início', path: '/' }, { label: 'Coleta de dados', path: '#' }, { label: 'Formulários', path: '/formularios' }];
  if (path.startsWith('/formularios/')) return [{ label: 'Início', path: '/' }, { label: 'Coleta de dados', path: '#' }, { label: 'Formulários', path: '/formularios' }, { label: 'Editar formulário', path: '#' }];
  return [{ label: 'Início', path: '/' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, setSidebarCollapsed, toasts, removeToast } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumb = getBreadcrumb(location.pathname);

  return (
    <div className="flex h-screen bg-page-bg">
      {/* Sidebar */}
      <aside
        className={`bg-sidebar flex-shrink-0 transition-all duration-300 flex flex-col ${
          sidebarCollapsed ? 'w-[52px]' : 'w-[220px]'
        }`}
      >
        <div className="h-[52px] flex items-center justify-center border-b border-white/10">
          {!sidebarCollapsed && (
            <span className="text-white font-bold text-lg tracking-tight">
              IOP<span className="text-[#85B7EB]">testes</span>
            </span>
          )}
          {sidebarCollapsed && (
            <span className="text-white font-bold text-lg">I</span>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {menuItems.map((section, sIdx) => (
            <div key={sIdx} className="mb-2">
              {!sidebarCollapsed && (
                <div className="px-4 py-2 text-[10px] uppercase text-white/40 font-semibold tracking-wider">
                  {section.section}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center mx-2 rounded-lg transition-colors ${
                      sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2 gap-3'
                    } ${
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-white/70 hover:bg-white/[0.08]'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} />
                    {!sidebarCollapsed && <span className="text-[13px]">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-[52px] bg-topbar flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white/80 hover:text-white p-1 rounded"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-baseline gap-1">
              <span className="text-white font-bold text-lg">IOP<span className="text-[#85B7EB]">testes</span></span>
              <span className="text-white/60 text-xs ml-2">Sistema de Inspeção e Testes</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-white/80 hover:text-white p-1">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold">
                WF
              </div>
              <span className="text-sm hidden sm:inline">Wesley Fagundes</span>
              <ChevronDown size={14} className="text-white/60" />
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="bg-white border-b border-[#CCCCCC] px-5 py-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-[13px]">
            {breadcrumb.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-text-secondary mx-1">/</span>}
                {crumb.path !== '#' ? (
                  <Link to={crumb.path} className="text-primary hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-text-secondary">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-5">
          {children}
        </main>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 animate-in slide-in-from-right ${
              toast.type === 'success' ? 'bg-status-green' :
              toast.type === 'error' ? 'bg-status-red' :
              'bg-status-yellow text-text-primary'
            }`}
          >
            {toast.message}
            <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-70 hover:opacity-100">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
