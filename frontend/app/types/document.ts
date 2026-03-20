export interface Document {
  id: number
  title: string
  content: string
  author?: string
  category?: string
  published_at?: string
  created_at: string
  updated_at?: string
  view_count?: number
}