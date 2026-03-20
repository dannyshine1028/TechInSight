'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { API_URL } from '../utils/api'
import { Document } from '../types/document'
import ArticleForm from '../components/ArticleForm'
import ArticleModal from '../components/ArticleModal'
import AnalyticsDashboard from '../components/AnalyticsDashboard'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'articles' | 'analytics'>('articles')
  const [articles, setArticles] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Document | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<Document | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  // ページネーション
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 24

  useEffect(() => {
    fetchArticles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const skip = (currentPage - 1) * itemsPerPage
      const response = await axios.get(API_URL.documents.list, {
        params: { skip, limit: itemsPerPage }
      })
      
      if (response.data.items) {
        setArticles(response.data.items)
        setTotalItems(response.data.total || 0)
        setTotalPages(response.data.total_pages || 1)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      alert('記事の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (article: Document) => {
    setEditingArticle(article)
    setIsFormOpen(true)
  }

  const handleDelete = async (article: Document) => {
    if (!confirm(`「${article.title}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      return
    }

    try {
      const response = await axios.delete(API_URL.documents.delete(article.id))
      console.log('Delete response:', response.data)
      
      // 削除成功メッセージ
      alert('記事を削除しました')
      
      // 記事一覧を再取得
      await fetchArticles()
      
      // 削除した記事が選択されていた場合はモーダルを閉じる
      if (selectedArticle && selectedArticle.id === article.id) {
        setIsModalOpen(false)
        setSelectedArticle(null)
      }
    } catch (error: any) {
      console.error('Error deleting article:', error)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
        alert(`削除に失敗しました: ${error.response.data?.detail || error.response.statusText || 'エラーが発生しました'}`)
      } else if (error.request) {
        console.error('No response received:', error.request)
        alert('バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。')
      } else {
        alert(`削除に失敗しました: ${error.message}`)
      }
    }
  }

  const handleArticleClick = (article: Document) => {
    setSelectedArticle(article)
    setIsModalOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingArticle(null)
    fetchArticles()
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">管理ページ</h1>
            <p className="text-gray-600 mt-2">記事の管理と分析</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium text-sm self-center"
            >
              トップに戻る
            </Link>
            {activeTab === 'articles' && (
              <button
                onClick={() => {
                  setEditingArticle(null)
                  setIsFormOpen(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all text-sm self-center"
              >
                + 新しい記事を作成
              </button>
            )}
          </div>
        </div>

        {/* タブ */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('articles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'articles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              記事管理
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              資料分析
            </button>
          </nav>
        </div>

        {/* コンテンツ */}
        {activeTab === 'analytics' ? (
          <AnalyticsDashboard />
        ) : (
          <>

        {/* 記事一覧テーブル */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">記事一覧</h2>
            <p className="text-sm text-gray-600 mt-1">
              全 {totalItems} 件中 {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} 件を表示
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              記事がありません
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        タイトル
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        著者
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        カテゴリ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        公開日
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        作成日
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {articles.map((article) => (
                      <tr key={article.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {article.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate cursor-pointer" title={article.title} onClick={() => handleArticleClick(article)}>
                            {article.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {article.author || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {article.category ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {article.category}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {article.published_at
                            ? new Date(article.published_at).toLocaleDateString('ja-JP')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(article.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(article)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDelete(article)}
                              className="text-red-600 hover:text-red-900"
                            >
                              削除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex justify-center items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ««
                  </button>
                  
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
                  
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    »»
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 記事作成・編集フォーム */}
        {isFormOpen && (
          <ArticleForm
            article={editingArticle}
            onClose={handleFormClose}
          />
        )}
          </>
        )}
      </div>

      {/* モーダル */}
      {isModalOpen && selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          incrementView={false}  // 管理ページでは閲覧数をインクリメントしない
          onClose={() => {
            setIsModalOpen(false)
            setSelectedArticle(null)
            // モーダルを閉じた時に記事一覧を再取得
            fetchArticles()
          }}
        />
      )}
    </main>
  )
}
