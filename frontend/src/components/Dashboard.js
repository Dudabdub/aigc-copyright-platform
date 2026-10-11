import React from 'react';

function Dashboard({ wallet, onNavigate }) {
    const { account, connect } = wallet;

    return (
        <div className="dashboard">
            {/* 侧边导航 */}
            <aside className="sidebar glass-card">
                <div className="sidebar-logo">
                    <span className="logo-mark">AIGC</span>
                    <span className="logo-text">版权保护</span>
                </div>
                <div className="nav-item active" onClick={() => onNavigate('dashboard')}>📊 数据概览</div>
                <div className="nav-item" onClick={() => onNavigate('upload')}>📤 原创存证</div>
                <div className="nav-item" onClick={() => onNavigate('detect')}>🔍 侵权检测</div>
                <div className="nav-item" onClick={() => onNavigate('certificate')}>📜 版权证书</div>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                    {account ? (
                        <div className="wallet-badge">
                            <span className="dot" />
                            {account.slice(0, 6)}...{account.slice(-4)}
                        </div>
                    ) : (
                        <button className="connect-btn" onClick={connect}>连接钱包</button>
                    )}
                </div>
            </aside>

            {/* 主内容 */}
            <main>
                <div className="top-bar glass-card">
                    <div className="search-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93A3B3" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" placeholder="搜索版权ID、哈希..." />
                    </div>
                    <div className="user-profile">
                        <div className="user-avatar"></div>
                    </div>
                </div>

                <div className="main-grid">
                    {/* KPI 卡片们 */}
                    <div className="glass-card card-kpi-1">
                        <div className="kpi-title">总存证量</div>
                        <div className="kpi-value">12,845</div>
                        <div className="kpi-trend">↑ 12.5% <span className="kpi-sub">本月</span></div>
                    </div>
                    <div className="glass-card card-kpi-2">
                        <div className="kpi-title">AI 检测次数</div>
                        <div className="kpi-value">8,230</div>
                        <div className="kpi-trend down">↓ 2.1% <span className="kpi-sub">本月</span></div>
                    </div>
                    <div className="glass-card card-kpi-3">
                        <div className="kpi-title">疑似侵权数</div>
                        <div className="kpi-value">342</div>
                        <div className="kpi-trend">↑ 8.4% <span className="kpi-sub">本月</span></div>
                    </div>
                    <div className="glass-card card-kpi-4">
                        <div className="kpi-title">累计交易数</div>
                        <div className="kpi-value">45.2K</div>
                        <div className="kpi-trend">↑ 24.7% <span className="kpi-sub">本月</span></div>
                    </div>

                    {/* 趋势图 */}
                    <div className="glass-card card-line">
                        <div className="card-header"><div className="card-title">存证趋势（近30天）</div></div>
                        <svg width="100%" height="200" viewBox="0 0 800 200" preserveAspectRatio="none" style={{ marginTop: '10px' }}>
                            <defs>
                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0"/>
                                </linearGradient>
                                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#7C5CFF"/>
                                    <stop offset="100%" stopColor="#3BC9FF"/>
                                </linearGradient>
                            </defs>
                            <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
                            <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
                            <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
                            <path d="M0,180 Q100,120 200,140 T400,80 T600,50 T800,90 L800,200 L0,200 Z" fill="url(#areaGrad)" />
                            <path d="M0,180 Q100,120 200,140 T400,80 T600,50 T800,90" fill="none" stroke="url(#lineGrad)" strokeWidth="4" strokeLinecap="round"/>
                        </svg>
                    </div>

                    {/* 环形图 */}
                    <div className="glass-card card-ring">
                        <div className="card-header"><div className="card-title">AI 检测覆盖率</div></div>
                        <div className="ring-container">
                            <svg width="140" height="140" viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="gradient-a" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#7C5CFF"/>
                                        <stop offset="100%" stopColor="#3BC9FF"/>
                                    </linearGradient>
                                </defs>
                                <circle className="ring-bg" cx="50" cy="50" r="45" />
                                <circle className="ring-fill" cx="50" cy="50" r="45" />
                            </svg>
                            <div className="ring-text">75%</div>
                        </div>
                    </div>

                    {/* 柱状图 */}
                    <div className="glass-card card-bar">
                        <div className="card-header"><div className="card-title">侵权类型分布</div></div>
                        <div className="bar-chart">
                            <div className="bar" style={{ height: '30%' }}></div>
                            <div className="bar" style={{ height: '60%' }}></div>
                            <div className="bar" style={{ height: '80%' }}></div>
                            <div className="bar" style={{ height: '40%' }}></div>
                            <div className="bar" style={{ height: '90%' }}></div>
                        </div>
                    </div>

                    {/* 最近存证列表 */}
                    <div className="glass-card card-list">
                        <div className="card-header"><div className="card-title">最近存证记录</div></div>
                        <div className="list-item"><span className="list-name">0x3f...A2b</span><span className="list-score">刚刚</span></div>
                        <div className="list-item"><span className="list-name">0x9c...E4f</span><span className="list-score">2 分钟前</span></div>
                        <div className="list-item"><span className="list-name">0x1a...B7c</span><span className="list-score">15 分钟前</span></div>
                        <div className="list-item"><span className="list-name">0x7e...D3a</span><span className="list-score">1 小时前</span></div>
                    </div>

                    {/* 热力图 */}
                    <div className="glass-card card-heat">
                        <div className="card-header"><div className="card-title">平台活跃度热力图</div></div>
                        <div className="heatmap">
                            {[...Array(36)].map((_, i) => (
                                <div key={i} className={`heat-cell ${i % 3 === 0 ? 'high' : i % 3 === 1 ? 'mid' : 'low'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;