'use client'

interface SearchBarProps {
  searchQuery: string
  searchType: 'keyword' | 'semantic'
  onSearchChange: (query: string) => void
  onSearchTypeChange: (type: 'keyword' | 'semantic') => void
}

export default function SearchBar({
  searchQuery,
  searchType,
  onSearchChange,
  onSearchTypeChange
}: SearchBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* 検索タイプ選択 */}
        <div className="flex gap-2">
          <button
            onClick={() => onSearchTypeChange('keyword')}
            className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
              searchType === 'keyword'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            キーワード検索
          </button>
          <button
            onClick={() => onSearchTypeChange('semantic')}
            className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
              searchType === 'semantic'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            セマンティック検索
          </button>
        </div>

        {/* 検索入力 */}
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchType === 'keyword' ? 'キーワードで検索...' : '意味で検索...'}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {searchType === 'semantic' && (
        <p className="text-sm text-gray-500 mt-2">
          **セマンティック検索では、入力したテキストの意味に近い記事を検索します**
        </p>
      )}
    </div>
  )
}
