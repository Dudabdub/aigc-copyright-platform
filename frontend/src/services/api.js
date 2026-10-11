import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 90_000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => config);

export async function getHealth() {
  const { data } = await api.get('/health');
  return data;
}

export async function uploadImage(file, ownerAddress) {
  const form = new FormData();
  form.append('image', file);
  if (ownerAddress) form.append('ownerAddress', ownerAddress);
  const { data } = await api.post('/upload/image', form);
  return data;
}

export async function signAgreement(creatorAddress, agreementText, signature) {
  const { data } = await api.post('/copyright/sign-agreement', {
    creatorAddress,
    agreementText,
    signature,
  });
  return data;
}

export async function registerCopyright(payload) {
  const { data } = await api.post('/copyright/register', payload);
  return data;
}

export async function listCopyrights(owner) {
  const { data } = await api.get('/copyright/list', { params: owner ? { owner } : {} });
  return data;
}

export async function verifyCopyright(file) {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/verify/copyright', form);
  return data;
}

export async function verifySimilar(file) {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/verify/similar', form);
  return data;
}

export async function detectAI(file) {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/detect/ai', form);
  return data;
}

export function getReportUrl(copyrightId) {
  return `${api.defaults.baseURL}/report/${encodeURIComponent(copyrightId)}`;
}

export default api;
