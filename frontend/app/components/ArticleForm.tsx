'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

import { API_URL } from '../utils/api'

interface Document {
  id: number
  title: string
  content: string
  author?: string
  category?: string
  published_at?: string
}

interface ArticleFormProps {
  article?: Document | null
  onClose: () => void
}

export default function ArticleForm({ article, onClose }: ArticleFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    category: '',
    published_at: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [categories, setCategories] = useState<string[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        content: article.content || '',
        author: article.author || '',
        category: article.category || '',
        published_at: article.published_at
          ? new Date(article.published_at).toISOString().slice(0, 16)
          : ''
      })
    }
    fetchCategories()
  }, [article])

  const fetchCategories = async () => {
    setLoadingCategories(true)
    try {
      const response = await axios.get(API_URL.documents.categories)
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // タイトルのバリデーション
    const titleTrimmed = formData.title.trim()
    if (!titleTrimmed) {
      newErrors.title = 'タイトルは必須です'
    } else if (titleTrimmed.length > 255) {
      newErrors.title = 'タイトルは255文字以内で入力してください'
    }

    // コンテンツのバリデーション
    const contentTrimmed = formData.content.trim()
    if (!contentTrimmed) {
      newErrors.content = 'コンテンツは必須です'
    }

    // 著者のバリデーション（オプション）
    if (formData.author && formData.author.trim().length > 100) {
      newErrors.author = '著者名は100文字以内で入力してください'
    }

    // カテゴリのバリデーション（オプション）
    if (formData.category && formData.category.trim().length > 100) {
      newErrors.category = 'カテゴリは100文字以内で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // まずバリデーションをチェック
    if (!validateForm()) {
      alert('入力内容を確認してください。')
      return
    }

    setLoading(true)

    try {
      // バリデーション済みのデータを使用
      const submitData: any = {
        title: formData.title.trim(),
        content: formData.content.trim()
      }

      if (formData.author && formData.author.trim()) {
        submitData.author = formData.author.trim()
      }
      if (formData.category && formData.category.trim()) {
        submitData.category = formData.category.trim()
      }
      if (formData.published_at) {
        submitData.published_at = new Date(formData.published_at).toISOString()
      }

      if (article) {
        // 更新
        await axios.put(API_URL.documents.update(article.id), submitData)
        alert('記事を更新しました')
      } else {
        // 新規作成
        await axios.post(API_URL.documents.create, submitData)
        alert('記事を作成しました')
      }

      onClose()
    } catch (error) {
      console.error('Error saving article:', error)
      alert(article ? '更新に失敗しました' : '作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {article ? '記事を編集' : '新しい記事を作成'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value })
                  // エラーをクリア
                  if (errors.title) {
                    setErrors({ ...errors, title: '' })
                  }
                }}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                コンテンツ <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => {
                  setFormData({ ...formData, content: e.target.value })
                  // エラーをクリア
                  if (errors.content) {
                    setErrors({ ...errors, content: '' })
                  }
                }}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.content ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={10}
                required
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-500">{errors.content}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  著者
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => {
                    setFormData({ ...formData, author: e.target.value })
                    // エラーをクリア
                    if (errors.author) {
                      setErrors({ ...errors, author: '' })
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.author ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.author && (
                  <p className="mt-1 text-sm text-red-500">{errors.author}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリ
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value })
                    // エラーをクリア
                    if (errors.category) {
                      setErrors({ ...errors, category: '' })
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loadingCategories}
                >
                  <option value="">選択してください。</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
                {loadingCategories && (
                  <p className="mt-1 text-sm text-gray-500">カテゴリを読み込み中...</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                公開日時
              </label>
              <input
                type="datetime-local"
                value={formData.published_at}
                onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </form>

        {/* フッター */}
        <div className="border-t p-6 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            キャンセル
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '保存中...' : article ? '更新' : '作成'}
          </button>
        </div>
      </div>
    </div>
  )
}
