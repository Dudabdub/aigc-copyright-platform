import { ArrowRight, BadgeCheck, Fingerprint, FileCheck2, FileImage, ScanSearch, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { shortAddress, shortHash, formatDate, normalizeCopyright } from '../utils/format';

export default function Dashboard({ wallet, health, certificates, onNavigate }) {
  const latest = certificates.slice(0, 3).map(normalizeCopyright);
  const chainLabel = health?.chainMode === 'tianping' ? '天平链接入模式' : 'Hardhat 本地演示';
  return (
    <div className="page-enter">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> DIGITAL PROVENANCE · AIGC</div>
          <h1>让原创有迹可循，<br /><em>让作品有据可证。</em></h1>
          <p>从数字水印、内容分析到区块链存证，构建一条可验证的图片版权证据链。</p>
          <div className="hero-actions"><button className="button button-primary" onClick={() => onNavigate('register')}>开始原创存证 <ArrowRight size={17} /></button><button className="button button-glass" onClick={() => onNavigate('detect')}>验证一张图片</button></div>
          <div className="hero-proof"><span><ShieldCheck size={15} /> 哈希校验</span><span><Fingerprint size={15} /> 水印追踪</span><span><Workflow size={15} /> 多源验证</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
          <div className="art-core"><Fingerprint size={76} strokeWidth={1.1} /></div>
          <div className="floating-chip chip-top"><span className="chip-spark"><Sparkles size={14} /></span><span><strong>作品指纹</strong><small>SHA-256 / pHash</small></span></div>
          <div className="floating-chip chip-bottom"><span className="chip-check"><BadgeCheck size={17} /></span><span><strong>证据可验证</strong><small>链上时间戳 · 内容哈希</small></span></div>
          <div className="art-star star-a">✳</div><div className="art-star star-b">✦</div>
        </div>
      </section>

      <div className="section-heading"><div><span className="section-kicker">WORKSPACE</span><h2>创作保护工作台</h2><p>常用能力一站完成，流程状态清晰可追溯。</p></div><div className={`service-chip ${health?.status === 'ok' ? 'service-ok' : 'service-unknown'}`}><span className="status-dot" />{health?.status === 'ok' ? '业务服务在线' : '服务状态待确认'} <span className="service-divider" />{chainLabel}</div></div>

      <section className="stat-grid">
        <div className="stat-card"><div className="stat-icon icon-violet"><FileCheck2 size={20} /></div><div className="stat-label">当前钱包作品数</div><div className="stat-value">{certificates.length.toString().padStart(2, '0')}</div><div className="stat-foot">{wallet.account ? `所有者 ${shortAddress(wallet.account)}` : '连接钱包后查看个人作品'}</div></div>
        <div className="stat-card"><div className="stat-icon icon-mint"><ShieldCheck size={20} /></div><div className="stat-label">验证能力</div><div className="stat-value">多维校验</div><div className="stat-foot">链上哈希 · 数据库记录 · 水印</div></div>
        <div className="stat-card"><div className="stat-icon icon-amber"><ScanSearch size={20} /></div><div className="stat-label">内容检测</div><div className="stat-value">AI + 相似度</div><div className="stat-foot">C2PA 元数据与感知指纹初筛</div></div>
      </section>

      <section className="section-heading section-heading-tight"><div><span className="section-kicker">QUICK ACCESS</span><h2>你想做什么？</h2></div></section>
      <section className="action-grid">
        <button className="action-card" onClick={() => onNavigate('register')}><div className="action-icon action-purple"><FileImage size={22} /></div><div className="action-text"><strong>原创图片存证</strong><span>签署原创承诺、生成水印并登记作品哈希</span><small>UPLOAD & REGISTER</small></div><ArrowRight size={18} className="action-arrow" /></button>
        <button className="action-card" onClick={() => onNavigate('detect')}><div className="action-icon action-blue"><ScanSearch size={22} /></div><div className="action-text"><strong>作品版权检测</strong><span>验证版权记录、提取水印并发现相似图片</span><small>VERIFY & DETECT</small></div><ArrowRight size={18} className="action-arrow" /></button>
        <button className="action-card" onClick={() => onNavigate('certificates')}><div className="action-icon action-green"><BadgeCheck size={22} /></div><div className="action-text"><strong>管理存证证书</strong><span>查看存证记录、交易哈希与取证报告</span><small>MY CERTIFICATES</small></div><ArrowRight size={18} className="action-arrow" /></button>
      </section>

      <section className="recent-panel">
        <div className="panel-heading"><div><span className="section-kicker">RECENT RECORDS</span><h2>最近存证</h2></div><button className="text-button" onClick={() => onNavigate('certificates')}>查看全部 <ArrowRight size={15} /></button></div>
        {!wallet.account ? <div className="empty-state compact-empty"><div className="empty-symbol"><ShieldCheck size={23} /></div><strong>连接钱包以查看个人存证</strong><span>你的作品记录会显示在这里。</span></div> : latest.length === 0 ? <div className="empty-state compact-empty"><div className="empty-symbol"><FileImage size={23} /></div><strong>还没有存证记录</strong><span>完成第一件作品存证后，记录会在这里展示。</span><button className="button button-light" onClick={() => onNavigate('register')}>创建第一条存证</button></div> : (
          <div className="recent-list">{latest.map((item) => <div className="recent-row" key={item.copyrightId || item.imageHash}><div className="recent-file-icon"><FileImage size={18} /></div><div className="recent-main"><strong>{item.copyrightId || '版权记录'}</strong><span>{shortHash(item.imageHash)} · {formatDate(item.createdAt)}</span></div><span className="badge badge-success">已登记</span><button className="row-open" aria-label="查看证书" onClick={() => onNavigate('certificates')}><ArrowRight size={17} /></button></div>)}</div>
        )}
      </section>
      <div className="legal-note"><ShieldCheck size={16} /><span>演示提示：当前界面展示的是系统业务状态。Hardhat 结果属于本地测试记录；未获得官方授权前，不代表天平链真实司法存证或司法机关背书。</span></div>
    </div>
  );
}
