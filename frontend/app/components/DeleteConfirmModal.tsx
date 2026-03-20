'use client'

interface DeleteConfirmModalProps {
  articleTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmModal({ articleTitle, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">記事を削除</h3>
        <p className="text-gray-700 mb-6">
          「<strong>{articleTitle}</strong>」を削除してもよろしいですか？
          <br />
          この操作は取り消せません。
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
