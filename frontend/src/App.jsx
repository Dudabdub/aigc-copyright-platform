import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, CircleHelp, Command, Menu, ShieldCheck, X } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import WalletButton from './components/WalletButton.jsx';
import Toast from './components/Toast.jsx';
import { useWallet } from './hooks/useWallet.js';
import Dashboard from './pages/Dashboard.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DetectPage from './pages/DetectPage.jsx';
import CertificatesPage from './pages/CertificatesPage.jsx';
import { getHealth, listCopyrights } from './services/api.js';
import { normalizeCopyright } from './utils/format.js';

const PAGE_META = {
  overview: { title: '工作台', subtitle: '创作保护状态总览' },
  register: { title: '原创存证', subtitle: '将创作时间与作品指纹记录下来' },
  detect: { title: '版权检测', subtitle: '多维度验证作品版权与来源线索' },
  certificates: { title: '我的证书', subtitle: '查看已登记作品和取证报告' },
};

export default function App() {
  const wallet = useWallet();
  const [active, setActive] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [health, setHealth] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [lastRecord, setLastRecord] = useState(null);

  const notify = useCallback((message, type = 'info') => setToast({ message, type, id: Date.now() + Math.random() }), []);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    getHealth().then((value) => { if (!cancelled) setHealth(value); }).catch(() => { if (!cancelled) setHealth(null); });
    return () => { cancelled = true; };
  }, []);

  const refreshCertificates = useCallback(async () => {
    if (!wallet.account) {
      setCertificates(lastRecord ? [normalizeCopyright(lastRecord)] : []);
      return;
    }
    try {
      const response = await listCopyrights(wallet.account);
      const rows = (response.data || []).map(normalizeCopyright);
      if (lastRecord) rows.unshift(normalizeCopyright(lastRecord));
      const unique = new Map();
      rows.forEach((item) => unique.set(item.copyrightId || item.imageHash, item));
      setCertificates([...unique.values()]);
    } catch {
      if (lastRecord) setCertificates([normalizeCopyright(lastRecord)]);
    }
  }, [wallet.account, lastRecord]);

  useEffect(() => { refreshCertificates(); }, [refreshCertificates]);

  const navigate = (page) => { setActive(page); setMobileNavOpen(false); };
  const handleRegistered = (record) => {
    setLastRecord(record);
    setCertificates((existing) => [normalizeCopyright(record), ...existing.filter((item) => item.copyrightId !== record.copyrightId)]);
    notify('已收到存证结果，可在“我的证书”中查看。', 'success');
    setActive('certificates');
  };

  const content = active === 'overview'
    ? <Dashboard wallet={wallet} health={health} certificates={certificates} onNavigate={navigate} />
    : active === 'register'
      ? <RegisterPage wallet={wallet} onToast={notify} onRegistered={handleRegistered} />
      : active === 'detect'
        ? <DetectPage onToast={notify} />
        : <CertificatesPage wallet={wallet} initialRecord={lastRecord} onToast={notify} />;

  return <div className="app-shell">
    {mobileNavOpen && <button className="mobile-overlay" onClick={() => setMobileNavOpen(false)} aria-label="关闭菜单" />}
    <div className={`sidebar-holder ${mobileNavOpen ? 'sidebar-open' : ''}`}><Sidebar active={active} onChange={navigate} chainMode={health?.chainMode || 'hardhat'} /><button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="关闭导航"><X size={20} /></button></div>
    <main className="main-shell">
      <header className="topbar">
        <div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="打开导航"><Menu size={20} /></button><div className="breadcrumbs"><span>墨证平台</span><ChevronRight size={14} /><strong>{PAGE_META[active].title}</strong></div><span className="topbar-divider" /><span className="topbar-subtitle">{PAGE_META[active].subtitle}</span></div>
        <div className="topbar-right"><div className="environment-chip"><span className={`status-dot ${health?.status === 'ok' ? '' : 'status-dot-muted'}`} />{health?.status === 'ok' ? 'API 在线' : 'API 待连接'}</div><button className="top-icon-button" title="帮助说明" onClick={() => notify('本地开发默认使用 Hardhat 测试链。天平链需获得官方应用接入授权后单独配置。', 'info')}><CircleHelp size={18} /></button><span className="topbar-divider" /><WalletButton wallet={wallet} /></div>
      </header>
      {wallet.walletError && !wallet.account && <div className="wallet-error-bar"><CircleHelp size={15} />{wallet.walletError}<button onClick={() => notify(wallet.walletError, 'error')}>详情</button></div>}
      <div className="page-container">{content}</div>
      <footer className="app-footer"><span>© {new Date().getFullYear()} 墨证 MOZHENG</span><span><ShieldCheck size={14} /> 数字内容可信存证实验平台</span><span className="footer-build"><Command size={13} /> COMPETITION BUILD 2.0</span></footer>
    </main>
    <Toast key={toast?.id || 'empty'} toast={toast} onClose={() => setToast(null)} />
  </div>;
}

