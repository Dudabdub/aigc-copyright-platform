import React, { useState, useEffect } from 'react';
import { listCopyrights } from '../services/api';

function CopyrightCertificate({ wallet, copyright }) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (copyright) {
            setList((prev) => [copyright, ...prev.filter((c) => c.copyrightId !== copyright.copyrightId)]);
        }
    }, [copyright]);

    const loadList = async () => {
        if (!wallet.account) return;
        setLoading(true);
        try {
            const res = await listCopyrights(wallet.account);
            setList(res.data || []);
        } catch (err) {
            console.error('加载失败:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (wallet.account && list.length === 0) loadList();
    }, [wallet.account]);

    return (
        <div className="card">
            <h3 className="card-title">📜 版权证书</h3>

            {!wallet.account && <p className="text-muted">请连接钱包后查看您的版权证书</p>}
            {list.length === 0 && wallet.account && <p className="text-muted">暂无版权存证记录</p>}

            <div className="certificate-list">
                {list.map((item) => (
                    <div key={item.copyrightId} className="certificate-item">
                        <div className="certificate-header">
                            <span className="cert-id">证书编号：{item.copyrightId}</span>
                            <span className="cert-status">✅ 已存证</span>
                        </div>
                        <div className="certificate-body">
                            <p><span className="text-muted">原图哈希：</span><span className="code-block">{item.imageHash}</span></p>
                            <p><span className="text-muted">创作者：</span><span className="code-block">{item.ownerAddress}</span></p>
                            <p><span className="text-muted">交易哈希：</span><span className="code-block">{item.txHash}</span></p>
                            {item.tianpingCertId && (
                                <p><span className="text-muted">天平链存证编号：</span><span className="code-block">{item.tianpingCertId}</span></p>
                            )}
                            <p><span className="text-muted">存证时间：</span>{new Date(item.createdAt * 1000).toLocaleString()}</p>
                        </div>
                        <a
                            className="btn btn-secondary btn-sm"
                            href={`/api/report/${item.copyrightId}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            下载取证报告
                        </a>
                    </div>
                ))}
            </div>

            {wallet.account && (
                <button className="btn btn-outline" onClick={loadList} disabled={loading} style={{ marginTop: '16px' }}>
                    {loading ? '刷新中...' : '刷新列表'}
                </button>
            )}
        </div>
    );
}

export default CopyrightCertificate;