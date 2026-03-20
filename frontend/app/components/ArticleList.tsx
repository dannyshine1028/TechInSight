'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import ArticleModal from './ArticleModal'
import ArticleForm from './ArticleForm'
import { highlightText, truncateWithContext } from '@/app/utils/highlight'
import { Document } from '@/app/types/document'
import { API_URL } from '@/app/utils/api'

interface ArticleListProps {
  searchQuery: string
  searchType: 'keyword' | 'semantic'
  selectedCategory?: string | null
  startDate?: string | null
  endDate?: string | null
  dateField?: 'created_at' | 'published_at'
}

export default function ArticleList({ searchQuery, searchType, selectedCategory, startDate, endDate, dateField = 'created_at' }: ArticleListProps) {
  const [articles, setArticles] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Document | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Document | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)
  
  // ページネーション用のstate
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 24

  useEffect(() => {
    // 検索クエリ、カテゴリ、日付が変更されたら、ページを1にリセット
    setCurrentPage(1)
  }, [searchQuery, searchType, selectedCategory, startDate, endDate, dateField])

  useEffect(() => {
    if (searchQuery.trim()) {
      searchArticles()
    } else {
      fetchArticles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchType, currentPage, selectedCategory, startDate, endDate, dateField])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const skip = (currentPage - 1) * itemsPerPage
      const params: any = { skip, limit: itemsPerPage }
      if (selectedCategory) {
        params.category = selectedCategory
      }
      if (startDate) {
        params.start_date = startDate
      }
      if (endDate) {
        params.end_date = endDate
      }
      if (dateField) {
        params.date_field = dateField
      }
      console.log('Fetching articles from:', API_URL.documents.list, params)
      const response = await axios.get(API_URL.documents.list, { params })
      
      // ページネーション情報を更新
      if (response.data.items) {
        setArticles(response.data.items)
        setTotalItems(response.data.total || 0)
        setTotalPages(response.data.total_pages || 1)
        console.log('Articles fetched:', response.data.items.length, 'items', `(Page ${currentPage}/${response.data.total_pages})`)
      } else {
        // 旧形式のAPIレスポンスに対応
        setArticles(response.data)
        setTotalItems(response.data.length)
        setTotalPages(1)
      }
    } catch (error: any) {
      console.error('Error fetching articles:', error)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
      } else if (error.request) {
        console.error('No response received:', error.request)
        alert('バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。')
      } else {
        alert('記事の取得に失敗しました: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const searchArticles = async () => {
    if (!searchQuery.trim()) {
      fetchArticles()
      return
    }

    setLoading(true)
    try {
      const skip = (currentPage - 1) * itemsPerPage
      console.log('Searching articles:', searchQuery, searchType, { skip, limit: itemsPerPage })
      const response = await axios.post(API_URL.documents.search, {
        query: searchQuery,
        search_type: searchType,
        skip: skip,
        limit: itemsPerPage
      })
      
      // ページネーション情報を更新
      if (response.data.items) {
        setArticles(response.data.items)
        setTotalItems(response.data.total || 0)
        setTotalPages(response.data.total_pages || 1)
        console.log('Search results:', response.data.items.length, 'items', `(Page ${currentPage}/${response.data.total_pages})`)
      } else {
        // 旧形式のAPIレスポンスに対応
        setArticles(response.data)
        setTotalItems(response.data.length)
        setTotalPages(1)
      }
    } catch (error: any) {
      console.error('Error searching articles:', error)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
      } else if (error.request) {
        console.error('No response received:', error.request)
        alert('バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。')
      } else {
        alert('検索に失敗しました: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleArticleClick = (article: Document) => {
    setSelectedArticle(article)
    setIsModalOpen(true)
  }

  const handleEdit = (article: Document) => {
    setEditingArticle(article)
    setIsFormOpen(true)
  }

  const handleDelete = async (article: Document) => {
    if (confirm(`「${article.title}」を削除してもよろしいですか？`)) {
      try {
        await axios.delete(API_URL.documents.delete(article.id))
        alert('記事を削除しました')
        if (searchQuery.trim()) {
          searchArticles()
        } else {
          fetchArticles()
        }
      } catch (error) {
        console.error('Error deleting article:', error)
        alert('削除に失敗しました')
      }
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingArticle(null)
    if (searchQuery.trim()) {
      searchArticles()
    } else {
      fetchArticles()
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // ページトップにスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* ページネーション情報表示 */}
      {totalItems > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          {searchQuery.trim() ? '検索結果' : '全'} {totalItems} 件中 {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} 件を表示
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchQuery.trim() ? '検索結果が見つかりませんでした' : '記事がありません'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => {
          // 検索クエリがある場合はハイライト表示
          const shouldHighlight = searchQuery.trim() && searchType === 'keyword'
          const displayTitle = shouldHighlight
            ? highlightText(article.title, searchQuery)
            : article.title
          const displayContent = shouldHighlight
            ? highlightText(
                truncateWithContext(article.content, searchQuery, 150),
                searchQuery
              )
            : article.content

          return (
          <div
            key={article.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
            onClick={() => handleArticleClick(article)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                {displayTitle}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {displayContent}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {article.category && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {article.category}
                </span>
              )}
              {article.author && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {article.author}
                </span>
              )}
            </div>

            <div className="flex justify-end items-center text-xs text-gray-600">
              <span className="flex items-center gap-1 mr-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {article.view_count || 0}
              </span>
              <span>公開日:
                {article.published_at
                  ? new Date(article.published_at).toLocaleDateString('ja-JP')
                  : new Date(article.created_at).toLocaleDateString('ja-JP')}
              </span>
            </div>
          </div>
          )
        })}
        </div>
      )}

      {/* ページネーションコントロール */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          {/* 最初のページボタン */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="最初のページ"
          >
            ««
          </button>
          
          {/* ページ番号表示 */}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-4 py-2 border rounded-md ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          
          {/* 最後のページボタン */}
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="最後のページ"
          >
            »»
          </button>
        </div>
      )}

      {isModalOpen && selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          searchQuery={searchQuery}
          searchType={searchType}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedArticle(null)
            // モーダルを閉じた時に記事一覧を再取得して最新の閲覧数を表示
            if (searchQuery.trim()) {
              searchArticles()
            } else {
              fetchArticles()
            }
          }}
          onEdit={() => {
            setIsModalOpen(false)
            handleEdit(selectedArticle)
          }}
          onDelete={() => {
            setIsModalOpen(false)
            handleDelete(selectedArticle)
          }}
          onArticleChange={async (articleId: number) => {
            // 関連記事をクリックしたときに記事を切り替え
            try {
              const response = await axios.get(API_URL.documents.detail(articleId), {
                params: { increment_view: true }
              })
              setSelectedArticle(response.data)
            } catch (error) {
              console.error('Error fetching article:', error)
              alert('記事の取得に失敗しました')
            }
          }}
        />
      )}

      {isFormOpen && (
        <ArticleForm
          article={editingArticle}
          onClose={handleFormClose}
        />
      )}
    </>
  )
}
