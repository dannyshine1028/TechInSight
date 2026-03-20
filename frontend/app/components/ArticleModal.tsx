'use client'

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { highlightText } from '../utils/highlight'
import { Document } from '@/app/types/document'
import { API_URL } from '../utils/api'
import RelatedArticles from './RelatedArticles'

interface ArticleModalProps {
  article: Document
  searchQuery?: string
  searchType?: 'keyword' | 'semantic'
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  incrementView?: boolean  // 閲覧数をインクリメントするかどうか（デフォルト: true）
  onArticleChange?: (articleId: number) => void  // 記事切り替え時のコールバック
}

export default function ArticleModal({ article, searchQuery, searchType, onClose, onEdit, onDelete, incrementView = true, onArticleChange }: ArticleModalProps) {
  // React Strict Modeによる重複実行を防ぐためのref
  const hasIncremented = useRef(false)
  
  // モーダルが開かれた時に閲覧数をインクリメント（incrementViewがtrueの場合のみ）
  useEffect(() => {
    if (!incrementView || hasIncremented.current) {
      return
    }
    
    const incrementViewCount = async () => {
      try {
        await axios.get(API_URL.documents.detail(article.id), {
          params: { increment_view: true }
        })
        hasIncremented.current = true
      } catch (error) {
        console.error('Error incrementing view count:', error)
        // エラーが発生してもモーダルは表示し続ける
      }
    }
    
    incrementViewCount()
    
    // クリーンアップ関数：モーダルが閉じられた時にリセット
    return () => {
      hasIncremented.current = false
    }
  }, [article.id, incrementView])
  const shouldHighlight = searchQuery && searchQuery.trim() && searchType === 'keyword'
  const displayTitle = shouldHighlight
    ? highlightText(article.title, searchQuery)
    : article.title
  const displayContent = shouldHighlight
    ? highlightText(article.content, searchQuery)
    : article.content

  const handleDownload = async () => {
    try {
      // html2canvasとjsPDFを動的インポート
      const html2canvas = (await import('html2canvas')).default
      const { default: jsPDF } = await import('jspdf')
      
      // PDFに含めるコンテンツを作成
      const contentDiv = document.createElement('div')
      contentDiv.style.width = '210mm' // A4幅
      contentDiv.style.padding = '20mm'
      contentDiv.style.backgroundColor = '#ffffff'
      contentDiv.style.fontFamily = 'sans-serif'
      contentDiv.style.color = '#000000'
      contentDiv.style.lineHeight = '1.6'
      
      // HTMLコンテンツを構築
      let htmlContent = `
        <div style="margin-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">${article.title}</h1>
        </div>
        <div style="margin-bottom: 20px; font-size: 12px; color: #666;">
      `
      
      if (article.author && article.author.trim()) {
        htmlContent += `<div style="margin-bottom: 5px;">著者: ${article.author}</div>`
      }
      
      if (article.category && article.category.trim()) {
        htmlContent += `<div style="margin-bottom: 5px;">カテゴリ: ${article.category}</div>`
      }
      
      if (article.published_at) {
        try {
          const publishedDate = new Date(article.published_at)
          if (!isNaN(publishedDate.getTime())) {
            const publishedStr = publishedDate.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            htmlContent += `<div style="margin-bottom: 5px;">公開日: ${publishedStr}</div>`
          }
        } catch (e) {
          console.error('Error formatting published_at:', e)
        }
      }
      
      if (article.created_at) {
        try {
          const createdDate = new Date(article.created_at)
          if (!isNaN(createdDate.getTime())) {
            const createdStr = createdDate.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            htmlContent += `<div style="margin-bottom: 5px;">作成日: ${createdStr}</div>`
          }
        } catch (e) {
          console.error('Error formatting created_at:', e)
        }
      }
      
      htmlContent += `
        </div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <div style="font-size: 14px; white-space: pre-wrap; word-wrap: break-word;">
          ${article.content.replace(/\n/g, '<br>')}
        </div>
      `
      
      contentDiv.innerHTML = htmlContent
      document.body.appendChild(contentDiv)
      
      // html2canvasで画像化
      const canvas = await html2canvas(contentDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      // 一時要素を削除
      document.body.removeChild(contentDiv)
      
      // PDFを作成
      const imgWidth = 210 // A4幅（mm）
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pdf = new jsPDF({
        orientation: imgHeight > 297 ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const pageHeight = imgHeight
      let heightLeft = pageHeight
      let position = 0
      
      // 画像をPDFに追加（複数ページ対応）
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, pageHeight)
      heightLeft -= pdfHeight
      
      while (heightLeft > 0) {
        position = heightLeft - pageHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, pageHeight)
        heightLeft -= pdfHeight
      }
      
      // PDFをダウンロード
      const fileName = `${article.title.replace(/[^\w\s-]/g, '')}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('PDFの生成に失敗しました。html2canvasパッケージがインストールされているか確認してください。')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex justify-between items-start p-6 border-b">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{displayTitle}</h2>
            <div className="flex flex-wrap gap-2">
              {article.category && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {article.category}
                </span>
              )}
              {article.author && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  著者: {article.author}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {displayContent}
            </p>
          </div>
          
          {/* 関連記事 */}
          <RelatedArticles 
            documentId={article.id} 
            category={article.category}
            onArticleClick={async (articleId: number) => {
              if (onArticleChange) {
                onArticleChange(articleId)
              } else {
                // フォールバック: 記事を取得して親に通知
                try {
                  const response = await axios.get(API_URL.documents.detail(articleId), {
                    params: { increment_view: false }
                  })
                  // 親コンポーネントに通知（ArticleListで処理）
                  if (window.parent) {
                    window.parent.postMessage({ type: 'articleChange', articleId }, '*')
                  }
                } catch (error) {
                  console.error('Error fetching article:', error)
                }
              }
            }}
          />
        </div>

        {/* フッター */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <div>
                作成日: {new Date(article.created_at).toLocaleString('ja-JP')}
              </div>
              {article.published_at && (
                <div>
                  公開日: {new Date(article.published_at).toLocaleString('ja-JP')}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                title="記事をPDFファイルとしてダウンロード"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                PDFダウンロード
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
