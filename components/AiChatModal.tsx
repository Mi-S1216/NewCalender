'use client'

import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type Proposal = {
  action: 'create' | 'update' | 'delete'
  schedule_id: string | null
  title: string
  date: string
  start: string
  end: string
  is_all_day: boolean
  category_id: string
  reason: string
}
type Turn = ChatMessage & { proposals?: (Proposal & { applied?: boolean })[] }

const QUICK_PROMPTS = ['来週の予定を見直して', '期日の近いToDoの作業時間を確保して', '詰め込みすぎの日はある？']

export default function AiChatModal({
  supabase, userId, onClose, onApplied,
}: {
  supabase: SupabaseClient
  userId: string
  onClose: () => void
  onApplied: () => void
}) {
  const [turns, setTurns] = useState<Turn[]>([
    { role: 'assistant', content: 'こんにちは。予定の調整を手伝います。気になっていることを教えてください。' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [turns, loading])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const next: Turn[] = [...turns, { role: 'user', content: text }]
    setTurns(next)
    setInput('')
    setLoading(true)

    // 最初の挨拶(assistant)はAPIに送らない。user始まりにする
    const history: ChatMessage[] = next.slice(1).map(({ role, content }) => ({ role, content }))
    const { data, error } = await supabase.functions.invoke('ai-chat', { body: { messages: history } })
    setLoading(false)

    if (error || data?.error) {
      setTurns([...next, { role: 'assistant', content: `エラー: ${error?.message ?? data.error}` }])
      return
    }
    setTurns([...next, { role: 'assistant', content: data.reply, proposals: data.proposals ?? [] }])
  }

  const apply = async (turnIndex: number, pIndex: number) => {
    const p = turns[turnIndex].proposals![pIndex]
    const start = p.is_all_day ? `${p.date}T00:00:00+09:00` : `${p.date}T${p.start}:00+09:00`
    const end = p.is_all_day ? `${p.date}T23:55:00+09:00` : `${p.date}T${p.end}:00+09:00`

    let error
    if (p.action === 'create') {
      ;({ error } = await supabase.from('schedules').insert([{
        user_id: userId, title: p.title, start_time: start, end_time: end, is_all_day: p.is_all_day, category_id: p.category_id,
      }]))
    } else if (p.action === 'update' && p.schedule_id) {
      ;({ error } = await supabase.from('schedules').update({
        title: p.title, start_time: start, end_time: end, is_all_day: p.is_all_day, category_id: p.category_id,
      }).eq('id', p.schedule_id))
    } else if (p.action === 'delete' && p.schedule_id) {
      ;({ error } = await supabase.from('schedules').delete().eq('id', p.schedule_id))
    }
    if (error) return alert('適用に失敗しました: ' + error.message)

    setTurns(prev => prev.map((t, i) => i !== turnIndex ? t : {
      ...t, proposals: t.proposals!.map((pp, j) => j === pIndex ? { ...pp, applied: true } : pp),
    }))
    onApplied()
  }

  const label = { create: '追加', update: '変更', delete: '削除' } as const
  const labelColor = { create: '#0B970D', update: '#00BFFF', delete: '#FF3356' } as const

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 md:p-4">
      <div className="bg-[#F0F8FF] w-full max-w-[600px] h-[88vh] md:h-[80vh] rounded-t-2xl md:rounded-xl shadow-2xl border-2 border-[#7100FF] flex flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-between items-center px-5 py-3 border-b-2 border-[#7100FF] shrink-0">
          <h3 className="text-lg md:text-xl font-extrabold text-[#7100FF]">AIマネジメント</h3>
          <button onClick={onClose} aria-label="閉じる" className="text-gray-500 hover:text-black font-bold text-3xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 overscroll-contain">
          {turns.map((t, i) => (
            <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm md:text-base whitespace-pre-wrap ${t.role === 'user' ? 'bg-[#7100FF] text-white rounded-br-sm' : 'bg-white text-gray-800 border border-[#87CEFA] rounded-bl-sm'}`}>
                {t.content}
                {t.proposals && t.proposals.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {t.proposals.map((p, j) => (
                      <div key={j} className="border-2 rounded-lg p-2 bg-[#F0F8FF]" style={{ borderColor: labelColor[p.action] }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: labelColor[p.action] }}>{label[p.action]}</span>
                          <span className="font-bold text-[#0000CD] break-all">{p.title}</span>
                        </div>
                        <div className="text-xs font-semibold text-gray-600">
                          {p.date.replace(/-/g, '/')} {p.is_all_day ? '終日' : `${p.start}〜${p.end}`}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{p.reason}</div>
                        <button
                          onClick={() => apply(i, j)}
                          disabled={p.applied}
                          className={`mt-2 w-full py-1.5 rounded font-bold text-sm ${p.applied ? 'bg-gray-200 text-gray-500' : 'bg-[#7100FF] text-white active:scale-[0.98]'}`}
                        >
                          {p.applied ? '適用済み' : `この${label[p.action]}を適用`}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && <div className="text-sm font-bold text-[#7100FF] animate-pulse">考えています…</div>}
          <div ref={bottomRef} />
        </div>

        {turns.length === 1 && (
          <div className="flex gap-2 px-4 pb-2 overflow-x-auto shrink-0">
            {QUICK_PROMPTS.map(q => (
              <button key={q} onClick={() => send(q)} className="whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full border-2 border-[#7100FF] text-[#7100FF] bg-white">{q}</button>
            ))}
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex gap-2 p-3 border-t-2 border-[#87CEFA] shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="例: 金曜の午後を空けたい"
            className="flex-1 border-2 border-[#87CEFA] rounded-lg px-3 py-2 text-base focus:outline-none focus:border-[#7100FF]"
          />
          <button type="submit" disabled={loading || !input.trim()} className="bg-[#7100FF] text-white font-bold px-4 rounded-lg disabled:opacity-40">送信</button>
        </form>
      </div>
    </div>
  )
}
