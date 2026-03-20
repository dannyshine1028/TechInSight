'use client'

interface DateFilterProps {
  startDate: string | null
  endDate: string | null
  dateField: 'created_at' | 'published_at'
  onStartDateChange: (date: string | null) => void
  onEndDateChange: (date: string | null) => void
  onDateFieldChange: (field: 'created_at' | 'published_at') => void
}

export default function DateFilter({
  startDate,
  endDate,
  dateField,
  onStartDateChange,
  onEndDateChange,
  onDateFieldChange,
}: DateFilterProps) {
  const handleClear = () => {
    onStartDateChange(null)
    onEndDateChange(null)
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <label className="block text-sm font-medium text-gray-700 min-w-[60px]">
        日付:
      </label>
      
      {/* 日付フィールド選択 */}
      <select
        value={dateField}
        onChange={(e) => onDateFieldChange(e.target.value as 'created_at' | 'published_at')}
        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
      >
        <option value="created_at">作成日</option>
        <option value="published_at">公開日</option>
      </select>

      {/* 開始日 */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">開始:</label>
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => onStartDateChange(e.target.value || null)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
        />
      </div>

      {/* 終了日 */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">終了:</label>
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => onEndDateChange(e.target.value || null)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
        />
      </div>

      {/* クリアボタン */}
      {(startDate || endDate) && (
        <button
          onClick={handleClear}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          クリア
        </button>
      )}
    </div>
  )
}
