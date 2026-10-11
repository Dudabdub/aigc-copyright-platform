import React from 'react';
import AgreementSign from '../modules/AgreementSign';
import ImageUpload from '../modules/ImageUpload';
import CopyrightCertificate from '../modules/CopyrightCertificate';
import InfringementDetect from '../modules/InfringementDetect';

function FeaturePage({ currentPage, goHome, wallet, agreementSigned, onSigned, lastCopyright, onRegistered }) {
    const titles = {
        upload: '原创存证',
        detect: '侵权检测',
        certificate: '版权证书',
    };

    return (
        <div className="feature-layout">
            {/* 顶部导航栏 (毛玻璃) */}
            <header className="header glass-panel">
                <div className="container header-inner">
                    <div className="logo" onClick={goHome} style={{ cursor: 'pointer' }}>
                        <span className="logo-mark">AIGC</span>
                        <span className="logo-text">版权保护平台</span>
                    </div>
                    <div className="wallet-area">
                        {wallet.account ? (
                            <div className="wallet-badge">
                                <span className="dot" />
                                {wallet.account.slice(0, 6)}...{wallet.account.slice(-4)}
                            </div>
                        ) : (
                            <button className="btn btn-primary" onClick={wallet.connect}>
                                连接钱包
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="container main-content">
                <button className="back-home-btn" onClick={goHome}>
                    ← 返回首页
                </button>
                <h2 className="page-title">{titles[currentPage]}</h2>

                <div className="feature-content-grid">
                    {currentPage === 'upload' && (
                        <>
                            <div className="grid-card">
                                <AgreementSign wallet={wallet} signed={agreementSigned} onSigned={onSigned} />
                            </div>
                            <div className="grid-card">
                                <ImageUpload wallet={wallet} agreementSigned={agreementSigned} onRegistered={onRegistered} />
                            </div>
                        </>
                    )}
                    {currentPage === 'detect' && (
                        <div className="single-card-layout">
                            <InfringementDetect wallet={wallet} />
                        </div>
                    )}
                    {currentPage === 'certificate' && (
                        <div className="single-card-layout">
                            <CopyrightCertificate wallet={wallet} copyright={lastCopyright} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default FeaturePage;