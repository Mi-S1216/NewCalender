'use client'

import { useEffect, useState } from 'react'
import { createClient, Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const CUSTOM_COLORS = [
  { name: '赤', code: '#FF3356' }, { name: '青', code: '#230AF2' }, { name: '黄', code: '#FFE204' },
  { name: '緑', code: '#0B970D' }, { name: '紫', code: '#7100FF' }, { name: '橙', code: '#FFAB00' },
  { name: '黒', code: '#040F30' }, { name: '白', code: '#FFFFF4' }, { name: '水色', code: '#3DFFF3' },
  { name: '黄緑', code: '#8CF000' }
]

const PRIORITY_COLORS: Record<number, string> = { 5: '#FF3E80', 4: '#FF7E61', 3: '#FFC061', 2: '#CDFF61', 1: '#00FF79' }

const HOLIDAYS = [
  '2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20', '2026-04-29', '2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06', '2026-07-20', '2026-08-11', '2026-09-21', '2026-09-22', '2026-09-23', '2026-10-12', '2026-11-03', '2026-11-23',
  '2027-01-01', '2027-01-11', '2027-02-11', '2027-02-23', '2027-03-21', '2027-03-22', '2027-04-29', '2027-05-03', '2027-05-04', '2027-05-05', '2027-07-19', '2027-08-11', '2027-09-20', '2027-09-23', '2027-10-11', '2027-11-03', '2027-11-23'
]

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
  const brightColors = ['#FFFFF4', '#FFE204', '#3DFFF3', '#8CF000', '#CDFF61', '#00FF79', '#FFCCFF', '#87CEFA']
  return brightColors.includes(hex.toUpperCase()) ? '#000000' : '#FFFFFF'
}

// UTCズレを防ぐためのローカル日付文字列生成器
const getLocalYYYYMMDD = (d: Date) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Todo { id: string; title: string; due_date: string | null; priority: number; is_completed: boolean; }
interface FinanceTransaction { id: string; type: 'income' | 'expense'; amount: number; transaction_date: string; category_id: string; }
interface Category { id: string; type: string; name: string; color_code: string; sort_order: number; }
interface Schedule { id: string; title: string; start_time: string; end_time: string; is_all_day: boolean; category_id: string; recurring_id: string | null; }

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setIsCheckingAuth(false); })
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

  if (isCheckingAuth) return <div className="min-h-screen bg-[#87CEFA]/30 flex items-center justify-center font-bold text-[#0000CD]">読み込み中...</div>

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#87CEFA]/30 p-4">
        <form onSubmit={handleAuth} className="bg-[#F0F8FF] p-8 rounded-xl shadow-xl w-full max-w-sm flex flex-col gap-5 text-[#0000CD] border-2 border-[#00BFFF]">
          <h2 className="text-2xl font-bold text-center border-b-2 border-[#00BFFF] pb-2">{isLoginMode ? 'ログイン' : '新規登録'}</h2>
          <div>
            <label className="block text-sm font-bold mb-1">メールアドレス</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="border-2 border-[#87CEFA] p-2 rounded w-full bg-white focus:outline-none focus:border-[#00BFFF]" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">パスワード</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="border-2 border-[#87CEFA] p-2 rounded w-full bg-white focus:outline-none focus:border-[#00BFFF]" />
          </div>
          <button type="submit" className="bg-[#00BFFF] text-white p-2 rounded font-bold hover:bg-[#0000CD] transition-colors mt-2">
            {isLoginMode ? 'ログイン' : '登録'}
          </button>
          <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-sm text-[#0000CD] font-bold hover:underline text-center">
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
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false)
  const [isManageCatModalOpen, setIsManageCatModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#FF3356')

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)

  useEffect(() => { setCurrentDate(new Date()) }, [])

  const fetchData = async () => {
    if (!currentDate) return
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startOfMonth = getLocalYYYYMMDD(firstDay)
    const endOfMonth = getLocalYYYYMMDD(lastDay)
    
    let { data: catData, error: catError } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
    
    if (catData && catData.length === 0 && !catError) {
      const defaultCategories = [
        { user_id: userId, type: 'schedule', name: '仕事', color_code: '#FF3356', sort_order: 0 },
        { user_id: userId, type: 'schedule', name: '遊び', color_code: '#230AF2', sort_order: 1 },
        { user_id: userId, type: 'schedule', name: '外食', color_code: '#FFE204', sort_order: 2 },
        { user_id: userId, type: 'schedule', name: 'その他', color_code: '#0B970D', sort_order: 3 },
        { user_id: userId, type: 'income', name: '給料', color_code: '#5311FF', sort_order: 0 },
        { user_id: userId, type: 'income', name: '臨時収入', color_code: '#EB80F6', sort_order: 1 },
        { user_id: userId, type: 'income', name: 'お小遣い', color_code: '#0C8E00', sort_order: 2 },
        { user_id: userId, type: 'expense', name: '食費', color_code: '#E6055C', sort_order: 0 },
        { user_id: userId, type: 'expense', name: '交通費', color_code: '#8F0000', sort_order: 1 },
        { user_id: userId, type: 'expense', name: '交際費', color_code: '#D78D00', sort_order: 2 },
        { user_id: userId, type: 'expense', name: '日用品費', color_code: '#DD6C91', sort_order: 3 },
        { user_id: userId, type: 'expense', name: '引き落とし', color_code: '#0D4227', sort_order: 4 },
        { user_id: userId, type: 'expense', name: 'その他', color_code: '#040F30', sort_order: 5 },
      ]
      await supabase.from('categories').insert(defaultCategories)
      const retryCat = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
      catData = retryCat.data
    }

    const [tRes, fRes, sRes] = await Promise.all([
      supabase.from('todos').select('*').order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('finance_transactions').select('*').gte('transaction_date', startOfMonth).lte('transaction_date', endOfMonth),
      supabase.from('schedules').select('*').gte('start_time', `${startOfMonth}T00:00:00+09:00`).lte('start_time', `${endOfMonth}T23:59:59+09:00`)
    ])

    if (tRes.data) setTodos(tRes.data)
    if (fRes.data) setTransactions(fRes.data)
    if (catData) setCategories(catData)
    if (sRes.data) setSchedules(sRes.data)
  }

  useEffect(() => { fetchData() }, [currentDate])

  useEffect(() => {
    const filteredCategories = categories.filter(c => c.type === modalType)
    if (filteredCategories.length > 0) setCategoryId(filteredCategories[0].id)
    else setCategoryId('')
    setIsCatDropdownOpen(false)
  }, [modalType, categories])

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!todoTitle.trim()) return
    const targetMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
    await supabase.from('todos').insert([{ user_id: userId, title: todoTitle, target_month: targetMonth, due_date: todoDueDate || null, priority: todoPriority, is_completed: false }])
    setTodoTitle(''); setTodoDueDate(''); setTodoPriority(3); fetchData();
  }

  const toggleTodo = async (id: string, status: boolean) => {
    await supabase.from('todos').update({ is_completed: !status }).eq('id', id); fetchData();
  }

  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id); fetchData();
  }

  const addCategory = async () => {
    if (!newCatName.trim()) return
    const currentMax = categories.filter(c => c.type === modalType).length
    await supabase.from('categories').insert([{ user_id: userId, type: modalType, name: newCatName, color_code: newCatColor, sort_order: currentMax }])
    setNewCatName(''); fetchData();
  }

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id); fetchData();
  }

  const handleDropCategory = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('catIndex'), 10)
    if (dragIndex === dropIndex || isNaN(dragIndex)) return

    const currentTypeCats = categories.filter(c => c.type === modalType)
    const newCats = [...currentTypeCats]
    const [dragged] = newCats.splice(dragIndex, 1)
    newCats.splice(dropIndex, 0, dragged)

    const updatedCategories = categories.map(c => {
      if (c.type !== modalType) return c
      const newMatch = newCats.findIndex(nc => nc.id === c.id)
      return { ...c, sort_order: newMatch }
    })
    setCategories(updatedCategories)

    for (let i = 0; i < newCats.length; i++) {
      await supabase.from('categories').update({ sort_order: i }).eq('id', newCats[i].id)
    }
  }

  const deleteTransaction = async (id: string) => {
    await supabase.from('finance_transactions').delete().eq('id', id); fetchData();
  }

  const handleDateClick = (dateString: string) => {
    if (isMultiSelectMode) {
      setSelectedDates(prev => prev.includes(dateString) ? prev.filter(d => d !== dateString) : [...prev, dateString])
    } else {
      setSelectedDates([dateString]); setIsModalOpen(true);
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    if (!isMultiSelectMode) setSelectedDates([])
    setAmountStr(''); setScheduleTitle(''); setIsCatDropdownOpen(false);
  }

  const addData = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDates.length === 0 || !categoryId) return alert('日付またはカテゴリが選択されていません。')

    if (modalType === 'schedule') {
      if (!scheduleTitle.trim()) return
      
      if (scheduleMode === 'weekly' && scheduleEndDate && selectedDates.length === 1) {
        const targetDate = selectedDates[0]
        const { data: recData, error } = await supabase.from('recurring_schedules').insert([{
          user_id: userId, start_date: targetDate, end_date: scheduleEndDate, day_of_week: new Date(targetDate).getDay()
        }]).select()
        if (error) return alert('定期ルール作成エラー: ' + error.message)
        const recurringId = recData[0].id
        
        const scheduleInserts = []
        const curr = new Date(targetDate)
        const end = new Date(scheduleEndDate)
        while (curr <= end) {
          const dStr = getLocalYYYYMMDD(curr)
          const startDateTime = isAllDay ? `${dStr}T00:00:00+09:00` : `${dStr}T${startTime}:00+09:00`
          const endDateTime = isAllDay ? `${dStr}T23:59:59+09:00` : `${dStr}T${endTime}:00+09:00`
          scheduleInserts.push({ user_id: userId, category_id: categoryId, recurring_id: recurringId, title: scheduleTitle, start_time: startDateTime, end_time: endDateTime, is_all_day: isAllDay })
          curr.setDate(curr.getDate() + 7)
        }
        await supabase.from('schedules').insert(scheduleInserts)
      } else {
        const scheduleInserts = selectedDates.map(dateStr => {
          const startDateTime = isAllDay ? `${dateStr}T00:00:00+09:00` : `${dateStr}T${startTime}:00+09:00`
          const endDateTime = isAllDay ? `${dateStr}T23:59:59+09:00` : `${dateStr}T${endTime}:00+09:00`
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
    if (type === 'single') await supabase.from('schedules').delete().eq('id', selectedSchedule.id)
    else if (type === 'future' && selectedSchedule.recurring_id) await supabase.from('schedules').delete().eq('recurring_id', selectedSchedule.recurring_id).gte('start_time', selectedSchedule.start_time)
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
    <main className="min-h-screen bg-[#87CEFA]/30 p-4 md:p-8 flex flex-col xl:flex-row gap-6 relative pb-32 font-sans">
      <section className="flex-1 bg-[#F0F8FF] p-6 rounded-xl shadow-xl border-2 border-[#87CEFA] text-[#0000CD] overflow-hidden flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="px-4 py-2 bg-[#00BFFF] text-white rounded hover:bg-[#0000CD] font-bold shadow-md transition-colors">先月</button>
            <h2 className="text-3xl font-extrabold">{currentDate.getFullYear()}/{String(currentDate.getMonth() + 1).padStart(2, '0')}</h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="px-4 py-2 bg-[#00BFFF] text-white rounded hover:bg-[#0000CD] font-bold shadow-md transition-colors">来月</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setIsMultiSelectMode(!isMultiSelectMode); setSelectedDates([]); }} className={`px-4 py-2 rounded font-bold text-sm shadow-md transition-colors border-2 ${isMultiSelectMode ? 'bg-[#0000CD] text-white border-[#0000CD]' : 'bg-white text-[#00BFFF] border-[#00BFFF] hover:bg-[#87CEFA]/20'}`}>
              複数日選択モード: {isMultiSelectMode ? 'ON' : 'OFF'}
            </button>
            {isMultiSelectMode && selectedDates.length > 0 && (
              <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-[#FF3356] text-white rounded font-bold text-sm shadow-md animate-bounce border-2 border-[#FF3356]">
                {selectedDates.length}日分を登録
              </button>
            )}
            <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 bg-white text-[#BA0200] border-2 border-[#BA0200] rounded font-bold text-sm hover:bg-[#BA0200] hover:text-white ml-2 transition-colors whitespace-nowrap shadow-md">
              ログアウト
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4 flex-1">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-7 gap-2 text-center font-bold mb-2">
              <div className="text-[#FF3356]">日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div className="text-[#00BFFF]">土</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="min-h-[140px] bg-[#87CEFA]/10 rounded" />
                const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                
                const dailyTx = transactions.filter(t => t.transaction_date === dateString)
                const dIncome = dailyTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
                const dExpense = dailyTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                
                const dailySchedules = schedules.filter(s => s.start_time.startsWith(dateString)).sort((a, b) => {
                  if (a.is_all_day && !b.is_all_day) return -1
                  if (!a.is_all_day && b.is_all_day) return 1
                  return a.start_time.localeCompare(b.start_time)
                })
                
                const isSelected = selectedDates.includes(dateString)
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                const dayOfWeek = dateObj.getDay()
                
                let borderClass = 'border-2 border-[#87CEFA]'
                if (HOLIDAYS.includes(dateString)) borderClass = 'border-4 border-[#BA0200] shadow-[0_0_10px_rgba(186,2,0,0.3)]'
                else if (dayOfWeek === 0) borderClass = 'border-4 border-[#FF3356] shadow-[0_0_10px_rgba(255,51,86,0.3)]'
                else if (dayOfWeek === 6) borderClass = 'border-4 border-[#3DFFF3] shadow-[0_0_10px_rgba(61,255,243,0.3)]'

                return (
                  <div 
                    key={day} 
                    onClick={() => handleDateClick(dateString)}
                    className={`min-h-[140px] rounded p-1.5 flex flex-col transition-all cursor-pointer overflow-hidden bg-white ${borderClass} ${isSelected ? 'ring-4 ring-[#0000CD] bg-[#87CEFA]/20 transform scale-95' : 'hover:shadow-lg hover:bg-[#F0F8FF]'}`}
                  >
                    <span className={`font-bold ml-1 ${dayOfWeek === 0 || HOLIDAYS.includes(dateString) ? 'text-[#FF3356]' : dayOfWeek === 6 ? 'text-[#00BFFF]' : 'text-[#0000CD]'}`}>{day}</span>
                    <div className="flex flex-col gap-1 mt-1">
                      {dailySchedules.map(sch => {
                        const catColor = categories.find(c => c.id === sch.category_id)?.color_code || '#cccccc'
                        return (
                          <div 
                            key={sch.id} 
                            onClick={(e) => { e.stopPropagation(); setSelectedSchedule(sch); }}
                            className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 font-semibold shadow-sm"
                            style={{ backgroundColor: catColor, color: getContrastTextColor(catColor) }}
                          >
                            {sch.is_all_day ? '終日' : sch.start_time.substring(11, 16)} {sch.title}
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-auto flex flex-col items-end text-xs font-bold w-full pt-1">
                      {dIncome > 0 && <span className="text-[#0000CD] bg-[#87CEFA]/30 px-1 rounded mb-0.5 truncate max-w-full">+{dIncome}</span>}
                      {dExpense > 0 && <span className="text-[#FF3356] bg-[#FF3356]/10 px-1 rounded truncate max-w-full">-{dExpense}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full xl:w-[400px] bg-[#F0F8FF] p-6 rounded-xl shadow-xl border-2 border-[#87CEFA] text-[#0000CD] flex flex-col">
        <h2 className="text-xl font-bold mb-4 border-b-2 border-[#00BFFF] pb-2">ToDoリスト</h2>
        <form onSubmit={addTodo} className="flex flex-col gap-2 mb-4">
          <input type="text" value={todoTitle} onChange={e => setTodoTitle(e.target.value)} placeholder="タスク名" required className="border-2 border-[#87CEFA] p-2 rounded focus:border-[#00BFFF] focus:outline-none" />
          <input type="date" value={todoDueDate} onChange={e => setTodoDueDate(e.target.value)} className="border-2 border-[#87CEFA] p-2 rounded focus:border-[#00BFFF] focus:outline-none" />
          <select value={todoPriority} onChange={e => setTodoPriority(Number(e.target.value))} className="border-2 border-[#87CEFA] p-2 rounded focus:border-[#00BFFF] focus:outline-none font-bold">
            {[5,4,3,2,1].map(p => <option key={p} value={p}>優先度 {p}</option>)}
          </select>
          <button type="submit" className="bg-[#00BFFF] text-white p-2 rounded hover:bg-[#0000CD] font-bold shadow-md transition-colors">追加</button>
        </form>
        <ul className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {todos.map(todo => (
            <li key={todo.id} className="flex justify-between items-center p-3 border border-[#87CEFA] rounded shadow-sm bg-white" style={{ borderLeft: `8px solid ${PRIORITY_COLORS[todo.priority]}` }}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={todo.is_completed} onChange={() => toggleTodo(todo.id, todo.is_completed)} className="w-5 h-5 mt-0.5 cursor-pointer accent-[#00BFFF]"/>
                <div className="flex flex-col">
                  <span className={`font-bold ${todo.is_completed ? 'line-through text-gray-400' : 'text-[#0000CD]'}`}>{todo.title}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-sm" style={{ backgroundColor: PRIORITY_COLORS[todo.priority] }}>優先度 {todo.priority}</span>
                    {todo.due_date && <span className="text-xs text-gray-500 font-semibold">期日: {todo.due_date.replace(/-/g, '/')}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteTodo(todo.id)} className="text-[#FF3356] text-sm font-bold hover:underline ml-2 whitespace-nowrap">削除</button>
            </li>
          ))}
        </ul>
      </section>

      <div className="fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl border-4 font-bold text-lg z-40 transform hover:scale-105 transition-transform" style={{ backgroundColor: savingsBgColor, color: savingsTextColor, borderColor: savingsTextColor }}>
        <div className="text-xs opacity-90 mb-1">今月のトータル貯金額</div>
        {monthlySavings > 0 ? '+' : ''}{monthlySavings.toLocaleString()} 円
      </div>

      {/* カテゴリ管理モーダル (ドラッグ＆ドロップ対応) */}
      {isManageCatModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-[#F0F8FF] p-6 rounded-xl w-[400px] shadow-2xl border-2 border-[#00BFFF]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#0000CD]">カテゴリの管理と並び替え</h3>
              <button onClick={() => setIsManageCatModalOpen(false)} className="text-gray-500 hover:text-[#FF3356] font-bold text-2xl">&times;</button>
            </div>
            
            <div className="mb-4 bg-white p-3 rounded border border-[#87CEFA]">
              <h4 className="text-sm font-bold text-[#0000CD] mb-2">新規作成</h4>
              <div className="flex flex-col gap-2">
                <input type="text" placeholder="カテゴリ名" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="border-2 border-[#87CEFA] p-1 rounded text-sm w-full focus:outline-none focus:border-[#00BFFF]" />
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_COLORS.map(c => <div key={c.code} onClick={() => setNewCatColor(c.code)} className={`w-6 h-6 rounded-full cursor-pointer border-2 ${newCatColor === c.code ? 'border-[#0000CD] scale-110' : 'border-transparent'}`} style={{backgroundColor: c.code}} title={c.name} />)}
                </div>
                <button type="button" onClick={addCategory} className="bg-[#00BFFF] text-white p-1.5 rounded text-sm font-bold shadow-md hover:bg-[#0000CD]">追加</button>
              </div>
            </div>

            <h4 className="text-sm font-bold text-[#0000CD] mb-2">並び替え (ドラッグで移動)</h4>
            <ul className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {categories.filter(c => c.type === modalType).map((c, index) => (
                <li 
                  key={c.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('catIndex', index.toString())}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropCategory(e, index)}
                  className="flex justify-between items-center bg-white p-2 border-2 border-[#87CEFA] rounded cursor-move hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-gray-400">≡</div>
                    <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c.color_code }} />
                    <span className="font-bold text-[#0000CD]">{c.name}</span>
                  </div>
                  <button onClick={() => deleteCategory(c.id)} className="text-[#FF3356] text-xs font-bold px-2 py-1 bg-[#FF3356]/10 rounded hover:bg-[#FF3356] hover:text-white transition-colors">削除</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isModalOpen && selectedDates.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#F0F8FF] p-6 rounded-xl w-[400px] shadow-2xl border-2 border-[#00BFFF] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#0000CD]">{selectedDates.length === 1 ? selectedDates[0].replace(/-/g, '/') : `${selectedDates.length}日分の選択`}</h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-[#FF3356] font-bold text-2xl">&times;</button>
            </div>
            {selectedDates.length === 1 && selectedDayTransactions.length > 0 && (
              <div className="mb-6 bg-white p-3 rounded border-2 border-[#87CEFA] shadow-inner">
                <h4 className="font-bold text-sm mb-2 text-[#0000CD] border-b-2 border-[#87CEFA] pb-1">この日の収支記録</h4>
                <div className="space-y-2">
                  {selectedDayTransactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1">
                      <div>
                        <span className={`font-bold mr-2 ${tx.type === 'income' ? 'text-[#0000CD]' : 'text-[#FF3356]'}`}>{tx.type === 'income' ? '収入' : '支出'}</span>
                        <span className="text-gray-700 font-semibold">{categories.find(c => c.id === tx.category_id)?.name}</span>
                        <span className="font-bold ml-2 text-black">{tx.amount.toLocaleString()}円</span>
                      </div>
                      <button type="button" onClick={() => deleteTransaction(tx.id)} className="text-[#FF3356] text-xs font-bold hover:underline">削除</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-1 mb-4 p-1 bg-[#87CEFA]/30 rounded-lg">
              <button onClick={() => setModalType('schedule')} className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${modalType === 'schedule' ? 'bg-[#0000CD] text-white shadow-md' : 'text-[#0000CD] hover:bg-white/50'}`}>予定</button>
              <button onClick={() => setModalType('income')} className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${modalType === 'income' ? 'bg-[#00BFFF] text-white shadow-md' : 'text-[#0000CD] hover:bg-white/50'}`}>収入</button>
              <button onClick={() => setModalType('expense')} className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${modalType === 'expense' ? 'bg-[#FF3356] text-white shadow-md' : 'text-[#0000CD] hover:bg-white/50'}`}>支出</button>
            </div>
            
            <form onSubmit={addData} className="flex flex-col gap-4">
              {modalType === 'schedule' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-[#0000CD]">予定のタイトル</label>
                    <input type="text" value={scheduleTitle} onChange={e => setScheduleTitle(e.target.value)} required className="border-2 border-[#87CEFA] p-2 rounded w-full focus:outline-none focus:border-[#00BFFF] font-bold" />
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2 rounded border border-[#87CEFA]">
                    <input type="checkbox" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} id="allday" className="w-5 h-5 cursor-pointer accent-[#00BFFF]"/>
                    <label htmlFor="allday" className="text-sm cursor-pointer font-bold text-[#0000CD]">終日</label>
                  </div>
                  {!isAllDay && (
                    <div className="flex gap-2 items-center bg-white p-2 rounded border border-[#87CEFA]">
                      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} step="300" required className="border-2 border-[#87CEFA] p-2 rounded flex-1 focus:outline-none focus:border-[#00BFFF] font-bold" />
                      <span className="font-bold text-[#0000CD]">〜</span>
                      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} step="300" required className="border-2 border-[#87CEFA] p-2 rounded flex-1 focus:outline-none focus:border-[#00BFFF] font-bold" />
                    </div>
                  )}
                  {selectedDates.length === 1 && (
                    <div className="border-t-2 border-[#87CEFA] pt-3 mt-1">
                      <label className="block text-sm font-bold mb-2 text-[#0000CD]">登録設定</label>
                      <select value={scheduleMode} onChange={(e) => setScheduleMode(e.target.value as 'single'|'weekly')} className="border-2 border-[#87CEFA] p-2 rounded w-full mb-2 text-sm font-bold focus:outline-none focus:border-[#00BFFF]">
                        <option value="single">この日のみ</option>
                        <option value="weekly">毎週（繰り返し設定）</option>
                      </select>
                      {scheduleMode === 'weekly' && (
                        <div className="pl-3 border-l-4 border-[#00BFFF] bg-white p-2 rounded">
                          <label className="block text-xs font-bold mb-1 text-[#0000CD]">終了日</label>
                          <input type="date" value={scheduleEndDate} min={selectedDates[0]} onChange={e => setScheduleEndDate(e.target.value)} required className="border-2 border-[#87CEFA] p-1 rounded text-sm w-full focus:outline-none focus:border-[#00BFFF] font-bold" />
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-[#0000CD]">金額 (円)</label>
                    <input type="number" value={amountStr} onChange={e => setAmountStr(e.target.value)} placeholder="金額を入力" className="border-2 border-[#87CEFA] p-2 rounded w-full focus:outline-none focus:border-[#00BFFF] font-bold text-lg" />
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2 rounded border border-[#87CEFA]">
                    <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} id="recurring" className="w-5 h-5 cursor-pointer accent-[#00BFFF]"/>
                    <label htmlFor="recurring" className="text-xs cursor-pointer text-[#0000CD] font-bold">毎月選択した日に固定費として自動登録する</label>
                  </div>
                </>
              )}
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-bold text-[#0000CD]">カテゴリ</label>
                  <button type="button" onClick={() => setIsManageCatModalOpen(true)} className="text-xs text-[#00BFFF] font-bold hover:underline bg-white px-2 py-1 rounded border border-[#87CEFA] shadow-sm">管理・並び替え</button>
                </div>
                
                {/* カスタムセレクトUI */}
                <div className="relative">
                  <div 
                    onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)} 
                    className="border-2 border-[#87CEFA] p-3 rounded w-full flex items-center justify-between cursor-pointer bg-white hover:border-[#00BFFF] transition-colors"
                  >
                    {categoryId ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full shadow-inner border border-gray-200" style={{ backgroundColor: categories.find(c => c.id === categoryId)?.color_code }} />
                        <span className="font-bold text-[#0000CD] text-lg">{categories.find(c => c.id === categoryId)?.name}</span>
                      </div>
                    ) : <span className="text-gray-400 font-bold">カテゴリを選択</span>}
                    <span className="text-[#00BFFF] text-xs font-bold">▼</span>
                  </div>
                  
                  {isCatDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-[#00BFFF] rounded shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                      {categories.filter(c => c.type === modalType).map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => { setCategoryId(c.id); setIsCatDropdownOpen(false); }}
                          className="flex items-center gap-3 p-3 hover:bg-[#F0F8FF] cursor-pointer border-b border-gray-100 last:border-0"
                        >
                          <div className="w-5 h-5 rounded-full shadow-inner border border-gray-200" style={{ backgroundColor: c.color_code }} />
                          <span className="font-bold text-[#0000CD]">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-white text-[#0000CD] border-2 border-[#87CEFA] p-3 rounded font-bold hover:bg-[#87CEFA]/20 transition-colors shadow-md">閉じる</button>
                <button type="submit" className="flex-1 bg-[#00BFFF] text-white p-3 rounded font-bold hover:bg-[#0000CD] transition-colors shadow-md text-lg">登録</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#F0F8FF] p-6 rounded-xl w-80 shadow-2xl border-2 border-[#00BFFF]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: categories.find(c => c.id === selectedSchedule.category_id)?.color_code }} />
              <h3 className="text-xl font-extrabold text-[#0000CD]">{selectedSchedule.title}</h3>
            </div>
            <p className="text-sm mb-6 text-[#00BFFF] font-bold border-b-2 border-[#87CEFA] pb-2 inline-block">
              {selectedSchedule.is_all_day ? '終日' : `${selectedSchedule.start_time.substring(11, 16)} 〜 ${selectedSchedule.end_time.substring(11, 16)}`}
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => deleteSchedule('single')} className="w-full bg-white text-[#FF3356] border-2 border-[#FF3356] p-2 rounded font-bold hover:bg-[#FF3356] hover:text-white transition-colors shadow-md">この予定のみ削除</button>
              {selectedSchedule.recurring_id && <button onClick={() => deleteSchedule('future')} className="w-full bg-[#BA0200] text-white p-2 rounded font-bold hover:bg-black transition-colors shadow-md">これ以降の定期予定も削除</button>}
              <button onClick={() => setSelectedSchedule(null)} className="w-full bg-white text-[#0000CD] border-2 border-[#87CEFA] p-2 rounded font-bold hover:bg-[#87CEFA]/20 transition-colors shadow-md mt-2">閉じる</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}