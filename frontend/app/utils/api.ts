/**
 * APIエンドポイントの統一管理
 * 新しいバックエンド構造に対応
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_VERSION = '/api/v1' // 新しいバックエンド構造に対応

export const API_URL = {
  base: API_BASE_URL,
  version: API_VERSION,
  
  // Documents API
  documents: {
    list: `${API_BASE_URL}${API_VERSION}/documents`,
    detail: (id: number) => `${API_BASE_URL}${API_VERSION}/documents/${id}`,
    create: `${API_BASE_URL}${API_VERSION}/documents`,
    update: (id: number) => `${API_BASE_URL}${API_VERSION}/documents/${id}`,
    delete: (id: number) => `${API_BASE_URL}${API_VERSION}/documents/${id}`,
    search: `${API_BASE_URL}${API_VERSION}/documents/search`,
    categories: `${API_BASE_URL}${API_VERSION}/documents/categories`,
  },
  
  // Embeddings API
  embeddings: {
    create: `${API_BASE_URL}${API_VERSION}/embeddings`,
    similarity: `${API_BASE_URL}${API_VERSION}/embeddings/similarity`,
  },
  
  // Analytics API
  analytics: {
    searchKeywords: `${API_BASE_URL}${API_VERSION}/analytics/search-keywords`,
    viewStats: `${API_BASE_URL}${API_VERSION}/analytics/view-stats`,
    updateFrequency: `${API_BASE_URL}${API_VERSION}/analytics/update-frequency`,
  },
  
  // Mentions API
  mentions: {
    create: `${API_BASE_URL}${API_VERSION}/mentions`,
    getByDocument: (id: number) => `${API_BASE_URL}${API_VERSION}/mentions/document/${id}`,
    getToDocument: (id: number) => `${API_BASE_URL}${API_VERSION}/mentions/to-document/${id}`,
    delete: (id: number) => `${API_BASE_URL}${API_VERSION}/mentions/${id}`,
  },
  
  // Document Links API
  documentLinks: {
    create: `${API_BASE_URL}${API_VERSION}/document-links`,
    getOutgoing: (id: number) => `${API_BASE_URL}${API_VERSION}/document-links/from/${id}`,
    getIncoming: (id: number) => `${API_BASE_URL}${API_VERSION}/document-links/to/${id}`,
    generateAuto: `${API_BASE_URL}${API_VERSION}/document-links/auto`,
    getRecommended: (id: number) => `${API_BASE_URL}${API_VERSION}/document-links/recommended/${id}`,
    delete: (id: number) => `${API_BASE_URL}${API_VERSION}/document-links/${id}`,
  },
  
  // Health check
  health: `${API_BASE_URL}/health`,
}

// 後方互換性のため、旧エンドポイントもサポート
export const LEGACY_API_URL = {
  documents: {
    list: `${API_BASE_URL}/api/documents`,
    detail: (id: number) => `${API_BASE_URL}/api/documents/${id}`,
    create: `${API_BASE_URL}/api/documents`,
    update: (id: number) => `${API_BASE_URL}/api/documents/${id}`,
    delete: (id: number) => `${API_BASE_URL}/api/documents/${id}`,
    search: `${API_BASE_URL}/api/documents/search`,
  },
}
