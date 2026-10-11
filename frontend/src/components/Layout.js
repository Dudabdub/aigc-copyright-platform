import React, { useState, useEffect } from 'react';

function Layout({ children, wallet }) {
    const { account, chainId, connect } = wallet;
    const [showBackToTop, setShowBackToTop] = useState(false);

    // 监听滚动，用于控制右下角的“返回顶部”按钮
    useEffect(() => {
        const handleScroll = () => setShowBackToTop(window.scrollY > window.innerHeight * 0.5);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* 顶栏导航：在首屏（深色区）为透明白字，滑到工作区（浅色区）自动变为毛玻璃深字 */}
            <header className="header">
                <div className="container header-inner">
                    <div className="logo">
                        <span className="logo-mark">AIGC</span>
                        <span className="logo-text">版权保护平台</span>
                    </div>

                    <div className="wallet-area">
                        {account ? (
                            <div className="wallet-badge">
                                <span className="dot" />
                                <span className="address">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                                <span className="chain">Chain {chainId}</span>
                            </div>
                        ) : (
                            <button className="btn btn-primary" onClick={connect}>
                                连接钱包
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* 页面主体内容：由 App.js 传递进来（包含首屏 Hero 和工作区） */}
            <main>
                {children}
            </main>

            {/* 底部页脚 */}
            <footer className="footer">
                <div className="container">
                    <p>© {new Date().getFullYear()} AIGC 版权保护平台 · 基于天平链司法存证 · 竞赛演示版本</p>
                </div>
            </footer>

            {/* 返回顶部悬浮按钮（滚动到下半部分才出现） */}
            {showBackToTop && (
                <button
                    className="back-to-top"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="返回顶部"
                >
                    ↑
                </button>
            )}
        </>
    );
}

export default Layout;