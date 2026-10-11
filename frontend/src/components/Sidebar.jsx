import { Activity, BadgeCheck, FileImage, Fingerprint, LayoutDashboard, SearchCheck, ShieldCheck } from 'lucide-react';

const items = [
  { id: 'overview', label: '工作台', icon: LayoutDashboard },
  { id: 'register', label: '原创存证', icon: FileImage },
  { id: 'detect', label: '版权检测', icon: SearchCheck },
  { id: 'certificates', label: '我的证书', icon: BadgeCheck },
];

export default function Sidebar({ active, onChange, chainMode }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Fingerprint size={23} strokeWidth={2.2} /></div>
        <div><div className="brand-name">墨证 <span>MOZHENG</span></div><div className="brand-subtitle">AIGC 版权存证平台</div></div>
      </div>
      <div className="side-caption">工作空间</div>
      <nav className="side-nav" aria-label="主导航">
        {items.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-item ${active === id ? 'selected' : ''}`} onClick={() => onChange(id)}>
            <Icon size={18} /><span>{label}</span>{active === id && <span className="nav-active-dot" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-spacer" />
      <div className="network-card">
        <div className="network-icon"><ShieldCheck size={18} /></div>
        <div className="network-copy"><strong>{chainMode === 'tianping' ? '天平链接口' : '本地演示网络'}</strong><span><i className="status-dot" />{chainMode === 'tianping' ? '需应用接入授权' : 'Hardhat · 测试环境'}</span></div>
      </div>
      <div className="sidebar-bottom"><Activity size={14} /> 让每一份创作都有据可循</div>
    </aside>
  );
}
