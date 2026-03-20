'use client'

import { useState } from 'react'
import Link from 'next/link'
import ArticleList from './components/ArticleList'
import SearchBar from './components/SearchBar'
import ArticleForm from './components/ArticleForm'
import CategoryFilter from './components/CategoryFilter'
import DateFilter from './components/DateFilter'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'keyword' | 'semantic'>('keyword')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [dateField, setDateField] = useState<'created_at' | 'published_at'>('created_at')
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">TechInSight</h1>
            <p className="text-gray-600 mt-2">AI/ML powered document management</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium shadow-md hover:shadow-lg transition-all text-sm"
            >
              記事管理
            </Link>
          </div>
        </div>

        {/* 検索バー */}
        <SearchBar
          searchQuery={searchQuery}
          searchType={searchType}
          onSearchChange={setSearchQuery}
          onSearchTypeChange={setSearchType}
        />

        {/* カテゴリフィルタ */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        
        {/* 日付フィルタ */}
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          dateField={dateField}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onDateFieldChange={setDateField}
        />
        
        {/* 記事一覧 */}
        <ArticleList
          searchQuery={searchQuery}
          searchType={searchType}
          selectedCategory={selectedCategory}
          startDate={startDate}
          endDate={endDate}
          dateField={dateField}
        />

      </div>
    </main>
  )
}
