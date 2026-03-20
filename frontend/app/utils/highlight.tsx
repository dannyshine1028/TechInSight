/**
 * テキスト内の検索キーワードをハイライト表示するユーティリティ
 */

import React from 'react'

/**
 * テキスト内のキーワードをハイライト表示用のJSXに変換
 * @param text ハイライト対象のテキスト
 * @param query 検索クエリ
 * @returns ハイライトされたJSX要素
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text
  }

  // クエリを正規表現エスケープして、大文字小文字を区別しない検索
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  
  // テキストを分割してハイライト部分をマーク
  const parts = text.split(regex)
  
  return parts.map((part, index) => {
    // クエリと一致する部分（大文字小文字を区別しない）
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark
          key={index}
          className="bg-yellow-200 text-gray-900 px-1 rounded"
        >
          {part}
        </mark>
      )
    }
    return <span key={index}>{part}</span>
  })
}

/**
 * テキストを切り詰めて、キーワード周辺のコンテキストを表示
 * @param text 対象テキスト
 * @param query 検索クエリ
 * @param maxLength 最大表示長
 * @returns 切り詰められたテキスト
 */
export function truncateWithContext(
  text: string,
  query: string,
  maxLength: number = 150
): string {
  if (text.length <= maxLength) {
    return text
  }

  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()
  const queryIndex = textLower.indexOf(queryLower)

  if (queryIndex === -1) {
    // クエリが見つからない場合は先頭を切り詰め
    return text.substring(0, maxLength) + '...'
  }

  // クエリの位置を中心に、前後を表示
  const start = Math.max(0, queryIndex - maxLength / 2)
  const end = Math.min(text.length, queryIndex + query.length + maxLength / 2)

  let result = text.substring(start, end)
  
  if (start > 0) {
    result = '...' + result
  }
  if (end < text.length) {
    result = result + '...'
  }

  return result
}
