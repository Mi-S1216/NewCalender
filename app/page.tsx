'use client'

import { useEffect, useState } from 'react'
import { createClient, Session } from '@supabase/supabase-js'

const supabaseUrl = 'https://othhbwmgztbjmqgrvsml.supabase.co'
const supabaseKey = 'sb_publishable_eMIsYIeAbbVlNYboCM2w6g_6aZVb9NC'
const supabase = createClient(supabaseUrl, supabaseKey)

const CUSTOM_COLORS = [
  { name: '赤', code: '#FF3356' }, { name: '青', code: '#230AF2' }, { name: '黄', code: '#FFE204' },
  { name: '緑', code: '#0B970D' }, { name: '紫', code: '#7100FF' }, { name: '橙', code: '#FFAB00' },
  { name: '黒', code: '#040F30' }, { name: '白', code: '#FFFFF4' }, { name: '水色', code: '#3DFFF3' },
  { name: '黄緑', code: '#8CF000' }
]

const PRIORITY_COLORS: Record<number, string> = { 5: '#FF3E80', 4: '#FF7E61', 3: '#FFC061', 2: '#CDFF61', 1: '#00FF79' }

const getSavingsColor = (amount: number) => {
  if (amount <= -100000) return '#000944'
  if (amount >= -99999 && amount <= -50000) return '#000974'
  if (amount >= -49999 && amount <= -30000) return '#0009D5'
  if (amount >= -29999 && amount <= -10000) return '#008FD5'
  if (amount >= -9999 && amount <= -1) return '#00F1FF'
  if (amount === 0) return '#000000'
  if (amount >= 1 && amount <= 10000) return '#FFCCFF'
  if (amount >= 10001 && amount <= 30000) return '#FF4300'
  if (amount >= 30001 && amount <= 50000) return '#BA0200'
  if (amount >= 50001 && amount <= 100000) return '#B9C3C9'
  return '#E5BD54'
}

const getContrastTextColor = (hex: string) => {
  const brightColors = ['#FFFFF4', '#FFE204', '#3DFFF3', '#8CF000', '#CDFF61', '#00FF79', '#FFCCFF']
  return brightColors.includes(hex.toUpperCase()) ? '#000000' : '#FFFFFF'
}

interface Todo { id: string; title: string; due_date: string | null; priority: number; is_completed: boolean; }
interface FinanceTransaction { id: string; type: 'income' | 'expense'; amount: number; transaction_date: string; category_id: string; }
interface Category { id: string; type: string; name: string; color_code: string; }
interface Schedule { id: string; title: string; start_time: string; end_time: string; is_all_day: boolean; category_id: string; recurring_id: string | null; }

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert('ログイン失敗: ' + error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert('登録失敗: ' + error.message)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleAuth} className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm flex flex-col gap-5 text-black border border-gray-200">
          <h2 className="text-2xl font-bold text-center border-b pb-2">{isLoginMode ? 'ログイン' : '新規登録'}</h2>
          <div>
            <label className="block text-sm font-bold mb-1">メールアドレス</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="border p-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">パスワード</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="border p-2 rounded w-full" />
          </div>
          <button type="submit" className="bg-indigo-600 text-white p-2 rounded font-bold hover:bg-indigo-700 transition-colors mt-2">
            {isLoginMode ? 'ログイン' : '登録'}
          </button>
          <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-sm text-indigo-600 font-bold hover:underline text-center">
            {isLoginMode ? 'アカウントを作成する' : '既存のアカウントでログイン'}
          </button>
        </form>
      </div>
    )
  }

  return <Dashboard userId={session.user.id} />
}

function Dashboard({ userId }: { userId: string }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  
  const [todoTitle, setTodoTitle] = useState('')
  const [todoPriority, setTodoPriority] = useState<number>(3)
  const [todoDueDate, setTodoDueDate] = useState('')
  const [currentDate, setCurrentDate] = useState<Date | null>(null)

  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [modalType, setModalType] = useState<'schedule' | 'income' | 'expense'>('schedule')
  const [amountStr, setAmountStr] = useState<string>('')
  const [isRecurring, setIsRecurring] = useState(false)
  
  const [scheduleTitle, setScheduleTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [isAllDay, setIsAllDay] = useState(false)
  
  const [scheduleMode, setScheduleMode] = useState<'single' | 'weekly'>('single')
  const [scheduleEndDate, setScheduleEndDate] = useState('') 

  const [categoryId, setCategoryId] = useState<string>('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#FF3356')

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)

  useEffect(() => { setCurrentDate(new Date()) }, [])

  const fetchData = async () => {
    if (!currentDate) return
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0]
    
    const [tRes, fRes, cRes, sRes] = await Promise.all([
      supabase.from('todos').select('*').order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('finance_transactions').select('*').gte('transaction_date', startOfMonth).lte('transaction_date', endOfMonth),
      supabase.from('categories').select('*'),
      supabase.from('schedules').select('*').gte('start_time', `${startOfMonth}T00:00:00Z`).lte('start_time', `${endOfMonth}T23:59:59Z`)
    ])

    if (tRes.data) setTodos(tRes.data)
    if (fRes.data) setTransactions(fRes.data)
    if (cRes.data) setCategories(cRes.data)
    if (sRes.data) setSchedules(sRes.data)
  }

  useEffect(() => { fetchData() }, [currentDate])

  useEffect(() => {
    const filteredCategories = categories.filter(c => c.type === modalType)
    if (filteredCategories.length > 0) setCategoryId(filteredCategories[0].id)
    else setCategoryId('')
    setIsAddingCategory(false)
  }, [modalType, categories])

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!todoTitle.trim()) return
    const targetMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
    await supabase.from('todos').insert([{ user_id: userId, title: todoTitle, target_month: targetMonth, due_date: todoDueDate || null, priority: todoPriority, is_completed: false }])
    setTodoTitle(''); setTodoDueDate(''); setTodoPriority(3); fetchData();
  }

  const toggleTodo = async (id: string, status: boolean) => {
    await supabase.from('todos').update({ is_completed: !status }).eq('id', id)
    fetchData()
  }

  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id)
    fetchData()
  }

  const addCategory = async () => {
    if (!newCatName.trim()) return
    await supabase.from('categories').insert([{ user_id: userId, type: modalType, name: newCatName, color_code: newCatColor, is_default: false }])
    setNewCatName(''); setIsAddingCategory(false); fetchData();
  }

  const deleteTransaction = async (id: string) => {
    await supabase.from('finance_transactions').delete().eq('id', id)
    fetchData()
  }

  const handleDateClick = (dateString: string) => {
    if (isMultiSelectMode) {
      setSelectedDates(prev => prev.includes(dateString) ? prev.filter(d => d !== dateString) : [...prev, dateString])
    } else {
      setSelectedDates([dateString])
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    if (!isMultiSelectMode) setSelectedDates([])
    setAmountStr('')
    setScheduleTitle('')
  }

  const addData = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDates.length === 0 || !categoryId) return

    if (modalType === 'schedule') {
      if (!scheduleTitle.trim()) return
      
      if (scheduleMode === 'weekly' && scheduleEndDate && selectedDates.length === 1) {
        const targetDate = selectedDates[0]
        const { data: recData, error } = await supabase.from('recurring_schedules').insert([{
          user_id: userId, start_date: targetDate, end_date: scheduleEndDate, day_of_week: new Date(targetDate).getDay()
        }]).select()
        if (error) return console.error(error)
        const recurringId = recData[0].id
        
        const scheduleInserts = []
        const curr = new Date(targetDate)
        const end = new Date(scheduleEndDate)
        while (curr <= end) {
          const dStr = curr.toISOString().split('T')[0]
          const startDateTime = isAllDay ? `${dStr}T00:00:00Z` : `${dStr}T${startTime}:00Z`
          const endDateTime = isAllDay ? `${dStr}T23:59:59Z` : `${dStr}T${endTime}:00Z`
          scheduleInserts.push({ user_id: userId, category_id: categoryId, recurring_id: recurringId, title: scheduleTitle, start_time: startDateTime, end_time: endDateTime, is_all_day: isAllDay })
          curr.setDate(curr.getDate() + 7)
        }
        await supabase.from('schedules').insert(scheduleInserts)

      } else {
        const scheduleInserts = selectedDates.map(dateStr => {
          const startDateTime = isAllDay ? `${dateStr}T00:00:00Z` : `${dateStr}T${startTime}:00Z`
          const endDateTime = isAllDay ? `${dateStr}T23:59:59Z` : `${dateStr}T${endTime}:00Z`
          return { user_id: userId, category_id: categoryId, title: scheduleTitle, start_time: startDateTime, end_time: endDateTime, is_all_day: isAllDay }
        })
        await supabase.from('schedules').insert(scheduleInserts)
      }
      setScheduleTitle(''); setScheduleMode('single'); setScheduleEndDate('');
    } else {
      const numAmount = Number(amountStr)
      if (numAmount <= 0 || isNaN(numAmount)) return alert('エラー：金額は1以上の数値を入力してください。')

      if (isRecurring) {
        const ruleInserts = selectedDates.map(dateStr => ({
          user_id: userId, category_id: categoryId, type: modalType, amount: numAmount, day_of_month: parseInt(dateStr.split('-')[2], 10)
        }))
        await supabase.from('finance_recurring_rules').insert(ruleInserts)
      }
      const txInserts = selectedDates.map(dateStr => ({
        user_id: userId, category_id: categoryId, type: modalType, amount: numAmount, transaction_date: dateStr
      }))
      await supabase.from('finance_transactions').insert(txInserts)
      setAmountStr('')
    }
    
    setIsRecurring(false); setIsModalOpen(false); setSelectedDates([]); fetchData();
  }

  const deleteSchedule = async (type: 'single' | 'future') => {
    if (!selectedSchedule) return
    if (type === 'single') {
      await supabase.from('schedules').delete().eq('id', selectedSchedule.id)
    } else if (type === 'future' && selectedSchedule.recurring_id) {
      await supabase.from('schedules').delete().eq('recurring_id', selectedSchedule.recurring_id).gte('start_time', selectedSchedule.start_time)
    }
    setSelectedSchedule(null); fetchData();
  }

  const getDaysInMonth = () => {
    if (!currentDate) return []
    const y = currentDate.getFullYear(); const m = currentDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate(); const firstDayIndex = new Date(y, m, 1).getDay();
    const days = []; for (let i = 0; i < firstDayIndex; i++) days.push(null); for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days
  }

  if (!currentDate) return null

  const monthlyIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const monthlyExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const monthlySavings = monthlyIncome - monthlyExpense
  const savingsBgColor = getSavingsColor(monthlySavings)
  const savingsTextColor = getContrastTextColor(savingsBgColor)

  const selectedDayTransactions = selectedDates.length === 1 ? transactions.filter(t => t.transaction_date === selectedDates[0]) : []

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col xl:flex-row gap-6 relative pb-32">
      <section className="flex-1 bg-white p-6 rounded-xl shadow-md border text-black overflow-hidden flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-bold">先月</button>
            <h2 className="text-2xl font-bold">{currentDate.getFullYear()}/{String(currentDate.getMonth() + 1).padStart(2, '0')}</h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-bold">来月</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setIsMultiSelectMode(!isMultiSelectMode); setSelectedDates([]); }} className={`px-4 py-2 rounded font-bold text-sm transition-colors border-2 ${isMultiSelectMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}>
              複数日選択モード: {isMultiSelectMode ? 'ON' : 'OFF'}
            </button>
            {isMultiSelectMode && selectedDates.length > 0 && (
              <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded font-bold text-sm animate-pulse border-2 border-green-600">
                {selectedDates.length}日分を登録
              </button>
            )}
            <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 bg-red-100 text-red-600 border border-red-200 rounded font-bold text-sm hover:bg-red-200 ml-2 whitespace-nowrap">
              ログアウト
            </button>
          </div>
        </div>

        {/* スマホ用横スクロール対応コンテナ */}
        <div className="overflow-x-auto pb-4 custom-scrollbar flex-1">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-7 gap-2 text-center font-bold mb-2">
              {['日', '月', '火', '水', '木', '金', '土'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="min-h-[140px] bg-gray-50 rounded" />
                const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dailyTx = transactions.filter(t => t.transaction_date === dateString)
                const dIncome = dailyTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
                const dExpense = dailyTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                const dailySchedules = schedules.filter(s => s.start_time.startsWith(dateString))
                const isSelected = selectedDates.includes(dateString)

                return (
                  <div 
                    key={day} 
                    onClick={() => handleDateClick(dateString)}
                    className={`min-h-[140px] border rounded p-1.5 flex flex-col transition-all cursor-pointer overflow-hidden bg-white ${isSelected ? 'ring-4 ring-indigo-500 bg-indigo-50' : 'hover:shadow-md'}`}
                  >
                    <span className={`font-bold ml-1 ${isSelected ? 'text-indigo-700' : ''}`}>{day}</span>
                    <div className="flex flex-col gap-1 mt-1">
                      {dailySchedules.map(sch => {
                        const catColor = categories.find(c => c.id === sch.category_id)?.color_code || '#cccccc'
                        return (
                          <div 
                            key={sch.id} 
                            onClick={(e) => { e.stopPropagation(); setSelectedSchedule(sch); }}
                            className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 font-semibold"
                            style={{ backgroundColor: catColor, color: getContrastTextColor(catColor) }}
                          >
                            {sch.is_all_day ? '終日' : sch.start_time.substring(11, 16)} {sch.title}
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-auto flex flex-col items-end text-xs font-bold w-full pt-1">
                      {dIncome > 0 && <span className="text-blue-600 bg-blue-50 px-1 rounded mb-0.5 truncate max-w-full">+{dIncome}</span>}
                      {dExpense > 0 && <span className="text-red-600 bg-red-50 px-1 rounded truncate max-w-full">-{dExpense}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full xl:w-[400px] bg-white p-6 rounded-xl shadow-md border text-black flex flex-col">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">ToDoリスト</h2>
        <form onSubmit={addTodo} className="flex flex-col gap-2 mb-4">
          <input type="text" value={todoTitle} onChange={e => setTodoTitle(e.target.value)} placeholder="タスク名" required className="border p-2 rounded" />
          <input type="date" value={todoDueDate} onChange={e => setTodoDueDate(e.target.value)} className="border p-2 rounded" />
          <select value={todoPriority} onChange={e => setTodoPriority(Number(e.target.value))} className="border p-2 rounded">
            {[5,4,3,2,1].map(p => <option key={p} value={p}>優先度 {p}</option>)}
          </select>
          <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold">追加</button>
        </form>
        <ul className="space-y-3 flex-1 overflow-y-auto pr-2">
          {todos.map(todo => (
            <li key={todo.id} className="flex justify-between items-center p-3 border rounded shadow-sm bg-white" style={{ borderLeft: `6px solid ${PRIORITY_COLORS[todo.priority]}` }}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={todo.is_completed} onChange={() => toggleTodo(todo.id, todo.is_completed)} className="w-5 h-5 mt-0.5 cursor-pointer accent-blue-600"/>
                <div className="flex flex-col">
                  <span className={`font-bold ${todo.is_completed ? 'line-through text-gray-400' : ''}`}>{todo.title}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: PRIORITY_COLORS[todo.priority] }}>優先度 {todo.priority}</span>
                    {todo.due_date && <span className="text-xs text-gray-500 font-semibold">期日: {todo.due_date.replace(/-/g, '/')}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteTodo(todo.id)} className="text-red-500 text-sm font-bold hover:text-red-700 ml-2 whitespace-nowrap">削除</button>
            </li>
          ))}
        </ul>
      </section>

      <div className="fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl border-2 font-bold text-lg z-40" style={{ backgroundColor: savingsBgColor, color: savingsTextColor, borderColor: savingsTextColor }}>
        <div className="text-xs opacity-90 mb-1">今月のトータル貯金額</div>
        {monthlySavings > 0 ? '+' : ''}{monthlySavings} 円
      </div>

      {isModalOpen && selectedDates.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[400px] text-black shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-indigo-700">{selectedDates.length === 1 ? selectedDates[0].replace(/-/g, '/') : `${selectedDates.length}日分の選択`}</h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-black font-bold text-xl">&times;</button>
            </div>
            {selectedDates.length === 1 && selectedDayTransactions.length > 0 && (
              <div className="mb-6 bg-gray-50 p-3 rounded border">
                <h4 className="font-bold text-sm mb-2 text-gray-700 border-b pb-1">この日の収支記録</h4>
                <div className="space-y-2">
                  {selectedDayTransactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center text-sm bg-white p-2 rounded shadow-sm">
                      <div>
                        <span className={`font-bold mr-2 ${tx.type === 'income' ? 'text-blue-600' : 'text-red-600'}`}>{tx.type === 'income' ? '収入' : '支出'}</span>
                        <span>{categories.find(c => c.id === tx.category_id)?.name}</span>
                        <span className="font-bold ml-2">{tx.amount}円</span>
                      </div>
                      <button type="button" onClick={() => deleteTransaction(tx.id)} className="text-red-500 text-xs font-bold hover:underline">削除</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-1 mb-4">
              <button onClick={() => setModalType('schedule')} className={`flex-1 p-2 rounded text-sm font-bold ${modalType === 'schedule' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>予定</button>
              <button onClick={() => setModalType('income')} className={`flex-1 p-2 rounded text-sm font-bold ${modalType === 'income' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>収入</button>
              <button onClick={() => setModalType('expense')} className={`flex-1 p-2 rounded text-sm font-bold ${modalType === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>支出</button>
            </div>
            <form onSubmit={addData} className="flex flex-col gap-4">
              {modalType === 'schedule' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold mb-1">予定のタイトル</label>
                    <input type="text" value={scheduleTitle} onChange={e => setScheduleTitle(e.target.value)} required className="border p-2 rounded w-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} id="allday" className="w-4 h-4 cursor-pointer"/>
                    <label htmlFor="allday" className="text-sm cursor-pointer font-semibold">終日</label>
                  </div>
                  {!isAllDay && (
                    <div className="flex gap-2 items-center">
                      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} step="300" required className="border p-2 rounded flex-1" />
                      <span>〜</span>
                      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} step="300" required className="border p-2 rounded flex-1" />
                    </div>
                  )}
                  {selectedDates.length === 1 && (
                    <div className="border-t pt-3 mt-1">
                      <label className="block text-sm font-bold mb-2">登録設定</label>
                      <select value={scheduleMode} onChange={(e) => setScheduleMode(e.target.value as 'single'|'weekly')} className="border p-2 rounded w-full mb-2 text-sm font-bold">
                        <option value="single">この日のみ</option>
                        <option value="weekly">毎週（繰り返し設定）</option>
                      </select>
                      {scheduleMode === 'weekly' && (
                        <div className="pl-2 border-l-4 border-indigo-200">
                          <label className="block text-xs font-bold mb-1 text-gray-600">終了日</label>
                          <input type="date" value={scheduleEndDate} min={selectedDates[0]} onChange={e => setScheduleEndDate(e.target.value)} required className="border p-1 rounded text-sm w-full" />
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold mb-1">金額 (円)</label>
                    <input type="number" value={amountStr} onChange={e => setAmountStr(e.target.value)} placeholder="金額を入力" className="border p-2 rounded w-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} id="recurring" className="w-4 h-4 cursor-pointer"/>
                    <label htmlFor="recurring" className="text-sm cursor-pointer text-gray-700 font-semibold">毎月選択した日に固定費として自動登録する</label>
                  </div>
                </>
              )}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-bold">カテゴリ</label>
                  <button type="button" onClick={() => setIsAddingCategory(!isAddingCategory)} className="text-xs text-blue-600 underline font-bold">追加する</button>
                </div>
                {isAddingCategory ? (
                  <div className="border p-3 rounded mb-2 bg-gray-50">
                    <input type="text" placeholder="新規カテゴリ名" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="border p-1 mb-2 w-full text-sm" />
                    <div className="flex flex-wrap gap-2 mb-3">
                      {CUSTOM_COLORS.map(c => <div key={c.code} onClick={() => setNewCatColor(c.code)} className={`w-6 h-6 cursor-pointer border ${newCatColor === c.code ? 'ring-2 ring-black' : ''}`} style={{backgroundColor: c.code}} title={c.name} />)}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={addCategory} className="flex-1 bg-blue-500 text-white p-1 rounded text-sm font-bold">保存</button>
                      <button type="button" onClick={() => setIsAddingCategory(false)} className="flex-1 bg-gray-300 p-1 rounded text-sm font-bold">キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="border p-2 rounded w-full">
                    {categories.filter(c => c.type === modalType).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-300 p-2 rounded font-bold hover:bg-gray-400">閉じる</button>
                <button type="submit" className="flex-1 bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700">登録</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 text-black shadow-xl">
            <h3 className="text-xl font-bold mb-2">{selectedSchedule.title}</h3>
            <p className="text-sm mb-6 text-gray-600 font-bold">
              {selectedSchedule.is_all_day ? '終日' : `${selectedSchedule.start_time.substring(11, 16)} 〜 ${selectedSchedule.end_time.substring(11, 16)}`}
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => deleteSchedule('single')} className="w-full bg-red-100 text-red-700 border border-red-300 p-2 rounded font-bold hover:bg-red-200">この予定のみ削除</button>
              {selectedSchedule.recurring_id && <button onClick={() => deleteSchedule('future')} className="w-full bg-red-600 text-white p-2 rounded font-bold hover:bg-red-700">これ以降の定期予定も削除</button>}
              <button onClick={() => setSelectedSchedule(null)} className="w-full bg-gray-200 p-2 rounded font-bold hover:bg-gray-300 mt-2">閉じる</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}