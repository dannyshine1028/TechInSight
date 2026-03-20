'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../utils/api'
import { Document } from '../types/document'
import ArticleModal from './ArticleModal'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface SearchKeyword {
  keyword: string
  count: number
  avg_results: number
}

interface ViewStats {
  total_views: number
  avg_views: number
  top_articles: Array<{
    id: number
    title: string
    view_count: number
  }>
  daily_stats: Array<{
    date: string
    total_views: number
  }>
}

interface UpdateFrequency {
  updated_count: number
  created_count: number
  daily_updates: Array<{
    date: string
    count: number
  }>
  daily_creates: Array<{
    date: string
    count: number
  }>
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [searchKeywords, setSearchKeywords] = useState<SearchKeyword[]>([])
  const [viewStats, setViewStats] = useState<ViewStats | null>(null)
  const [updateFrequency, setUpdateFrequency] = useState<UpdateFrequency | null>(null)
  const [days, setDays] = useState(30)
  const [selectedArticle, setSelectedArticle] = useState<Document | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [keywordsRes, viewsRes, updatesRes] = await Promise.all([
        axios.get(API_URL.analytics.searchKeywords, { params: { limit: 10, days } }),
        axios.get(API_URL.analytics.viewStats, { params: { days } }),
        axios.get(API_URL.analytics.updateFrequency, { params: { days } }),
      ])

      setSearchKeywords(keywordsRes.data)
      setViewStats(viewsRes.data)
      setUpdateFrequency(updatesRes.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      alert('分析データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleArticleClick = async (articleId: number) => {
    try {
      const response = await axios.get(API_URL.documents.detail(articleId), {
        params: { increment_view: false } // 分析ページでは閲覧数をインクリメントしない
      })
      setSelectedArticle(response.data)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Error fetching article:', error)
      alert('記事の取得に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 検索キーワードチャート用データ
  const searchKeywordsData = {
    labels: searchKeywords.map(k => k.keyword),
    datasets: [
      {
        label: '検索回数',
        data: searchKeywords.map(k => k.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  }

  // 閲覧数推移チャート用データ
  const viewStatsData = viewStats?.daily_stats ? {
    labels: viewStats.daily_stats.map(d => new Date(d.date).toLocaleDateString('ja-JP')),
    datasets: [
      {
        label: '総閲覧数',
        data: viewStats.daily_stats.map(d => d.total_views),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
    ],
  } : null

  // 更新頻度チャート用データ
  const updateFrequencyData = updateFrequency ? {
    labels: Array.from(new Set([
      ...updateFrequency.daily_updates.map(d => d.date),
      ...updateFrequency.daily_creates.map(d => d.date),
    ])).sort().map(d => new Date(d).toLocaleDateString('ja-JP')),
    datasets: [
      {
        label: '更新数',
        data: Array.from(new Set([
          ...updateFrequency.daily_updates.map(d => d.date),
          ...updateFrequency.daily_creates.map(d => d.date),
        ])).sort().map(date => {
          const update = updateFrequency.daily_updates.find(d => d.date === date)
          return update ? update.count : 0
        }),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
      {
        label: '新規作成数',
        data: Array.from(new Set([
          ...updateFrequency.daily_updates.map(d => d.date),
          ...updateFrequency.daily_creates.map(d => d.date),
        ])).sort().map(date => {
          const create = updateFrequency.daily_creates.find(d => d.date === date)
          return create ? create.count : 0
        }),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  } : null

  // 更新/作成比率チャート用データ
  const updateRatioData = updateFrequency ? {
    labels: ['更新', '新規作成'],
    datasets: [
      {
        data: [updateFrequency.updated_count, updateFrequency.created_count],
        backgroundColor: [
          'rgba(239, 68, 68, 0.5)',
          'rgba(59, 130, 246, 0.5)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null

  return (
    <div className="space-y-6">
      {/* 期間選択 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          期間選択
        </label>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={1}>今日</option>
          <option value={7}>過去7日間</option>
          <option value={30}>過去30日間</option>
          <option value={90}>過去90日間</option>
          <option value={365}>過去1年間</option>
        </select>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">総閲覧数</h3>
          <p className="text-3xl font-bold text-blue-600">
            {viewStats?.total_views.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            平均: {viewStats?.avg_views.toFixed(1) || 0} 回/記事
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">更新数</h3>
          <p className="text-3xl font-bold text-red-600">
            {updateFrequency?.updated_count || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            過去{days}日間
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">新規作成数</h3>
          <p className="text-3xl font-bold text-green-600">
            {updateFrequency?.created_count || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            過去{days}日間
          </p>
        </div>
      </div>

      {/* 人気検索キーワード */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">人気検索キーワード</h2>
        {searchKeywords.length > 0 ? (
          <div className="h-64">
            <Bar
              data={searchKeywordsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        ) : (
          <p className="text-gray-500">データがありません</p>
        )}
      </div>

      {/* 閲覧数推移 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">閲覧数推移</h2>
        {viewStatsData ? (
          <div className="h-64">
            <Line
              data={viewStatsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        ) : (
          <p className="text-gray-500">データがありません</p>
        )}
      </div>

      {/* 更新頻度 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">更新頻度</h2>
          {updateFrequencyData ? (
            <div className="h-64">
              <Bar
                data={updateFrequencyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500">データがありません</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">更新/作成比率</h2>
          {updateRatioData ? (
            <div className="h-64">
              <Doughnut
                data={updateRatioData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
              <span className='py-2'>更新 {updateRatioData.datasets[0].data[0]}件 / 新規作成 {updateRatioData.datasets[0].data[1]}件</span>
            </div>
          ) : (
            <p className="text-gray-500">データがありません</p>
          )}
        </div>
      </div>

      {/* 人気記事 */}
      {viewStats && viewStats.top_articles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">人気記事</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">閲覧数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {viewStats.top_articles.map((article) => (
                  <tr key={article.id}>
                    <td 
                      className="px-4 py-2 text-sm text-gray-900 cursor-pointer hover:text-blue-600 hover:underline"
                      onClick={() => handleArticleClick(article.id)}
                    >
                      {article.title}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 text-right">
                      {article.view_count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 記事詳細モーダル */}
      {isModalOpen && selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          incrementView={false}  // 分析ページでは閲覧数をインクリメントしない
          onClose={() => {
            setIsModalOpen(false)
            setSelectedArticle(null)
          }}
        />
      )}
    </div>
  )
}
