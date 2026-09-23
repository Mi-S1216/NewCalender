'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function CalendarSyncModal({
  supabase, userId, onClose,
}: {
  supabase: SupabaseClient
  userId: string
  onClose: () => void
}) {
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('calendar_tokens').select('token').maybeSingle()
    if (data) return setToken(data.token)
    const { data: created, error } = await supabase.from('calendar_tokens').insert([{ user_id: userId }]).select('token').single()
    if (error) alert('連携URLの作成に失敗しました: ' + error.message)
    else setToken(created.token)
  }

  useEffect(() => { load() }, [])

  const regenerate = async () => {
    if (!confirm('今のURLは使えなくなります。登録済みのカレンダーでは購読をやり直してください。')) return
    await supabase.from('calendar_tokens').delete().eq('user_id', userId)
    setToken(null)
    load()
  }

  const httpsUrl = token ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/calendar-feed?token=${token}` : ''
  const webcalUrl = httpsUrl.replace(/^https:/, 'webcal:')
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`

  const copy = async () => {
    await navigator.clipboard.writeText(httpsUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F0F8FF] p-6 rounded-xl w-full max-w-[520px] shadow-2xl border-2 border-[#00BFFF] text-[#0000CD]">
        <div className="flex justify-between items-center mb-4 border-b-2 border-[#00BFFF] pb-2">
          <h3 className="text-xl font-bold">カレンダー連携</h3>
          <button onClick={onClose} aria-label="閉じる" className="text-gray-500 hover:text-[#FF3356] font-bold text-3xl leading-none">&times;</button>
        </div>

        {!token ? <p className="font-bold">準備中…</p> : (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">一度登録すると、このアプリの予定が自動でカレンダーに反映されます(読み取り専用)。</p>

            <a href={googleUrl} target="_blank" rel="noreferrer" className="block text-center bg-[#00BFFF] text-white p-3 rounded font-bold hover:bg-[#0000CD]">Googleカレンダーに追加</a>
            <a href={webcalUrl} className="block text-center bg-white border-2 border-[#00BFFF] p-3 rounded font-bold hover:bg-[#87CEFA]/20">iPhone / Mac のカレンダーに追加</a>

            <div className="bg-white p-3 rounded border border-[#87CEFA]">
              <div className="text-xs font-bold mb-1">Android・その他のアプリ用URL</div>
              <div className="flex gap-2">
                <input readOnly value={httpsUrl} className="flex-1 text-xs border border-[#87CEFA] rounded px-2 py-1 bg-[#F0F8FF]" />
                <button onClick={copy} className="text-xs font-bold px-3 rounded bg-[#0000CD] text-white">{copied ? 'コピー済み' : 'コピー'}</button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">AndroidはGoogleカレンダー経由で同期されます(上の「Googleカレンダーに追加」を使えばOK)。</p>
            </div>

            <p className="text-[11px] text-gray-500">このURLを知っている人は予定を閲覧できます。共有してしまった場合は再発行してください。</p>
            <button onClick={regenerate} className="text-xs font-bold text-[#FF3356] hover:underline">URLを再発行</button>
          </div>
        )}
      </div>
    </div>
  )
}
