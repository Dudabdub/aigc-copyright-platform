export function shortAddress(value = '') {
  if (!value || typeof value !== 'string') return '未连接钱包';
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function shortHash(value = '', head = 10, tail = 8) {
  if (!value || typeof value !== 'string') return '—';
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function formatDate(value) {
  if (value === null || value === undefined || value === '') return '—';
  let date;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const number = Number(value);
    date = new Date(number < 1e12 ? number * 1000 : number);
  } else {
    date = new Date(value);
  }
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('zh-CN', { hour12: false });
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function normalizeCopyright(item = {}) {
  return {
    ...item,
    copyrightId: item.copyrightId ?? item.copyright_id ?? '',
    imageHash: item.imageHash ?? item.image_hash ?? '',
    watermarkedHash: item.watermarkedHash ?? item.watermarked_hash ?? '',
    fingerprint: item.fingerprint ?? '',
    imageCid: item.imageCid ?? item.image_cid ?? '',
    watermarkedCid: item.watermarkedCid ?? item.watermarked_cid ?? '',
    metadataCid: item.metadataCid ?? item.metadata_cid ?? '',
    ownerAddress: item.ownerAddress ?? item.owner_address ?? '',
    txHash: item.txHash ?? item.tx_hash ?? '',
    tianpingCertId: item.tianpingCertId ?? item.tianping_cert_id ?? null,
    createdAt: item.createdAt ?? item.created_at ?? null,
  };
}

export function getErrorMessage(error) {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.error || error?.response?.data?.message;
  if (status === 413) return '文件过大，请压缩后重试。';
  if (status === 404) return serverMessage || '接口不存在，请确认后端已启动且路由版本一致。';
  if (status >= 500) return serverMessage || '后端处理失败，请查看后端日志。';
  if (error?.code === 'ERR_NETWORK') return '无法连接后端服务，请确认 backend 已在 3001 端口启动。';
  return serverMessage || error?.message || '操作失败，请稍后重试。';
}
