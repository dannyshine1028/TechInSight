'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../utils/api'
import { Document } from '../types/document'

interface RelatedArticle {
  id: number
  target_document: Document
  link_type: string
  similarity_score?: number
  created_at: string
}

interface RelatedArticlesProps {
  documentId: number
  category?: string | null  // 現在の記事のカテゴリ
  onArticleClick?: (articleId: number) => void  // 記事クリック時のコールバック
}

export default function RelatedArticles({ documentId, category, onArticleClick }: RelatedArticlesProps) {
  const [outgoingLinks, setOutgoingLinks] = useState<RelatedArticle[]>([])
  const [incomingLinks, setIncomingLinks] = useState<RelatedArticle[]>([])
  const [recommendedLinks, setRecommendedLinks] = useState<RelatedArticle[]>([])
  const [categoryRelatedArticles, setCategoryRelatedArticles] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming' | 'recommended'>('outgoing')

  useEffect(() => {
    fetchRelatedArticles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, category])

  const fetchRelatedArticles = async () => {
    setLoading(true)
    try {
      const promises = [
        axios.get(API_URL.documentLinks.getOutgoing(documentId)),
        axios.get(API_URL.documentLinks.getIncoming(documentId)),
        axios.get(API_URL.documentLinks.getRecommended(documentId)),
      ]

      // カテゴリが存在する場合、同じカテゴリの記事を取得
      if (category && category.trim()) {
        promises.push(
          axios.get(API_URL.documents.list, {
            params: {
              category: category,
              skip: 0,
              limit: 10, // 多めに取得してからフィルタリング
            }
          })
        )
      }

      const results = await Promise.all(promises)
      setOutgoingLinks(results[0].data)
      setIncomingLinks(results[1].data)
      setRecommendedLinks(results[2].data)

      // カテゴリが存在する場合、同じカテゴリの記事を処理
      if (category && category.trim() && results.length > 3) {
        const categoryArticles = results[3].data.items || []
        // 現在の記事を除外し、最大2件を取得
        const filtered = categoryArticles
          .filter((article: Document) => article.id !== documentId)
          .slice(0, 2)
        setCategoryRelatedArticles(filtered)
      } else {
        setCategoryRelatedArticles([])
      }
    } catch (error) {
      console.error('Error fetching related articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLink = async (linkId: number) => {
    if (!confirm('このリンクを削除しますか？')) {
      return
    }

    try {
      await axios.delete(API_URL.documentLinks.delete(linkId))
      fetchRelatedArticles()
    } catch (error) {
      console.error('Error deleting link:', error)
      alert('リンクの削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const renderLinks = (links: RelatedArticle[], showCategoryArticles: boolean = false) => {
    // 関連記事タブの場合、カテゴリ記事も含める
    const allItems: Array<{ type: 'link' | 'category', data: RelatedArticle | Document }> = []
    
    // リンクを追加
    links.forEach(link => {
      allItems.push({ type: 'link', data: link })
    })
    
    // 関連記事タブで、カテゴリ記事がある場合は追加（最大2件）
    if (showCategoryArticles && categoryRelatedArticles.length > 0) {
      categoryRelatedArticles.forEach(article => {
        allItems.push({ type: 'category', data: article })
      })
    }
    
    if (allItems.length === 0) {
      return <p className="text-gray-500 text-sm">関連記事がありません</p>
    }

    return (
      <div className="space-y-2">
        {allItems.map((item, index) => {
          if (item.type === 'link') {
            const link = item.data as RelatedArticle
            return (
              <div
                key={link.id || link.target_document.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <button
                      onClick={() => onArticleClick?.(link.target_document.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-left cursor-pointer"
                    >
                      {link.target_document.title}
                    </button>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {link.link_type === 'manual' ? '手動' : link.link_type === 'auto' ? '自動' : '推薦'}
                      </span>
                      {link.similarity_score !== undefined && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                          類似度: {(link.similarity_score * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {link.id > 0 && link.link_type !== 'recommended' && (
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            )
          } else {
            const article = item.data as Document
            return (
              <div
                key={`category-${article.id}`}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <button
                    onClick={() => onArticleClick?.(article.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-left cursor-pointer"
                  >
                    {article.title}
                  </button>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded">
                      {article.category}
                    </span>
                    {article.author && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {article.author}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          }
        })}
      </div>
    )
  }

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">関連記事</h3>
      
      {/* タブ */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-4">
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'outgoing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            関連記事 ({outgoingLinks.length + categoryRelatedArticles.length})
          </button>
          <button
            onClick={() => setActiveTab('incoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'incoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            バックリンク ({incomingLinks.length})
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recommended'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            推薦 ({recommendedLinks.length})
          </button>
        </nav>
      </div>

      {/* コンテンツ */}
      <div>
        {activeTab === 'outgoing' && renderLinks(outgoingLinks, true)}
        {activeTab === 'incoming' && renderLinks(incomingLinks, false)}
        {activeTab === 'recommended' && renderLinks(recommendedLinks, false)}
      </div>
    </div>
  )
}
