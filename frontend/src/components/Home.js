import React from 'react';

function Home({ wallet, onNavigate }) {
    const { account, connect } = wallet;

    // 左上角的功能小组件
    const widgets = [
        { id: 'upload', icon: '📤', title: '原创存证', desc: '上传图片，生成版权' },
        { id: 'detect', icon: '🔍', title: '侵权检测', desc: 'AI 识别，相似检索' },
        { id: 'certificate', icon: '📜', title: '版权证书', desc: '查看链上存证记录' },
    ];

    return (
        <div className="home-layout">
            {/* 1. 动态极光背景层 (Aurora Gradient) */}
            <div className="aurora-bg">
                <div className="aurora-blob blob-1" />
                <div className="aurora-blob blob-2" />
                <div className="aurora-blob blob-3" />
                <div className="aurora-blob blob-4" />
            </div>

            {/* 2. 左上角功能小组件层 */}
            <div className="widget-grid">
                {widgets.map((w, index) => (
                    <button
                        key={w.id}
                        className="widget-card"
                        style={{
                            animationDelay: `${index * 80}ms`,
                            transform: `rotate(${index % 2 === 0 ? '-0.8deg' : '0.8deg'})`
                        }}
                        onClick={() => onNavigate(w.id)}
                    >
                        <span className="widget-icon">{w.icon}</span>
                        <span className="widget-title">{w.title}</span>
                        <span className="widget-desc">{w.desc}</span>
                    </button>
                ))}
            </div>

            {/* 3. 顶部右侧钱包状态 */}
            <div className="home-wallet">
                {account ? (
                    <div className="wallet-badge glass-panel">
                        <span className="dot" />
                        {account.slice(0, 6)}...{account.slice(-4)}
                    </div>
                ) : (
                    <button className="btn btn-glass" onClick={connect}>
                        连接钱包
                    </button>
                )}
            </div>

            {/* 4. 居中 Slogan 与 CTA */}
            <div className="hero-center">
                <div className="hero-tag glass-panel">基于天平链司法存证</div>
                <h1 className="hero-slogan">
                    让每一张 AIGC 图片<br />都有据可查
                </h1>
                <p className="hero-desc">
                    区块链 + 盲水印双核驱动，为你的数字资产提供司法级保护。
                </p>
                <div className="hero-actions">
                    <button className="btn btn-primary btn-large" onClick={() => onNavigate('upload')}>
                        立即开始存证
                    </button>
                    <button className="btn btn-glass btn-large" onClick={() => onNavigate('detect')}>
                        免费体验检测
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Home;