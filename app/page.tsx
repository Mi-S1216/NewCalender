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

const getLocalYYYYMMDD = (d: Date) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatLocalTime = (isoString: string) => {
  const d = new Date(isoString)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
  
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [todayString, setTodayString] = useState('')

  // ToDo
  const [todoTitle, setTodoTitle] = useState('')
  const [todoPriority, setTodoPriority] = useState<number>(3)
  const [todoDueDate, setTodoDueDate] = useState('')
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)

  // カレンダー操作
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 収支・予定登録
  const [modalType, setModalType] = useState<'schedule' | 'income' | 'expense'>('schedule')
  const [amountStr, setAmountStr] = useState<string>('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [editingTxId, setEditingTxId] = useState<string | null>(null)
  
  const [scheduleTitle, setScheduleTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [isAllDay, setIsAllDay] = useState(false)
  const [scheduleMode, setScheduleMode] = useState<'single' | 'weekly'>('single')
  const [scheduleEndDate, setScheduleEndDate] = useState('') 

  // カテゴリ関連
  const [categoryId, setCategoryId] = useState<string>('')
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false)
  const [isManageCatModalOpen, setIsManageCatModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#FF3356')

  // スケジュール詳細・編集用
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [isEditingSchedule, setIsEditingSchedule] = useState(false)
  const [editSchTitle, setEditSchTitle] = useState('')
  const [editSchStart, setEditSchStart] = useState('')
  const [editSchEnd, setEditSchEnd] = useState('')
  const [editSchIsAllDay, setEditSchIsAllDay] = useState(false)
  const [editSchCatId, setEditSchCatId] = useState('')
  const [isEditCatDropdownOpen, setIsEditCatDropdownOpen] = useState(false)

  useEffect(() => { 
    setCurrentDate(new Date())
    setTodayString(getLocalYYYYMMDD(new Date()))
  }, [])

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
    if (filteredCategories.length > 0 && !editingTxId) setCategoryId(filteredCategories[0].id)
    else if (!editingTxId) setCategoryId('')
    setIsCatDropdownOpen(false)
  }, [modalType, categories, editingTxId])

  // =====================
  // ToDo処理
  // =====================
  const submitTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!todoTitle.trim()) return
    if (editingTodoId) {
      const { error } = await supabase.from('todos').update({
        title: todoTitle, due_date: todoDueDate || null, priority: todoPriority
      }).eq('id', editingTodoId)
      if (error) { alert('更新エラー: ' + error.message); return; }
      setEditingTodoId(null)
    } else {
      const targetMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
      const { error } = await supabase.from('todos').insert([{ user_id: userId, title: todoTitle, target_month: targetMonth, due_date: todoDueDate || null, priority: todoPriority, is_completed: false }])
      if (error) { alert('追加エラー: ' + error.message); return; }
    }
    setTodoTitle(''); setTodoDueDate(''); setTodoPriority(3); fetchData();
  }

  const editTodo = (todo: Todo) => {
    setEditingTodoId(todo.id)
    setTodoTitle(todo.title)
    setTodoDueDate(todo.due_date || '')
    setTodoPriority(todo.priority)
  }

  const cancelEditTodo = () => {
    setEditingTodoId(null)
    setTodoTitle(''); setTodoDueDate(''); setTodoPriority(3);
  }

  const toggleTodo = async (id: string, status: boolean) => {
    const { error } = await supabase.from('todos').update({ is_completed: !status }).eq('id', id); 
    if (error) alert('状態更新エラー: ' + error.message)
    else fetchData();
  }

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id); 
    if (error) alert('削除エラー: ' + error.message)
    else fetchData();
  }

  // =====================
  // カテゴリ処理
  // =====================
  const addCategory = async () => {
    if (!newCatName.trim()) return
    const currentMax = categories.filter(c => c.type === modalType).length
    const { error } = await supabase.from('categories').insert([{ user_id: userId, type: modalType, name: newCatName, color_code: newCatColor, sort_order: currentMax }])
    if (error) { alert('カテゴリ追加エラー: ' + error.message); return; }
    setNewCatName(''); fetchData();
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id); 
    if (error) alert('カテゴリ削除エラー: ' + error.message)
    else fetchData();
  }

  const moveCategory = async (currentIndex: number, direction: 'up' | 'down') => {
    const currentTypeCats = categories.filter(c => c.type === modalType)
    if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === currentTypeCats.length - 1)) return
    const newCats = [...currentTypeCats]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const temp = newCats[currentIndex]; newCats[currentIndex] = newCats[targetIndex]; newCats[targetIndex] = temp;
    
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

  // =====================
  // モーダル・収支・予定登録処理
  // =====================
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
    setAmountStr(''); setScheduleTitle(''); setIsCatDropdownOpen(false); setEditingTxId(null);
  }

  const startEditTransaction = (tx: FinanceTransaction) => {
    setEditingTxId(tx.id)
    setModalType(tx.type)
    setAmountStr(tx.amount.toString())
    setCategoryId(tx.category_id)
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('finance_transactions').delete().eq('id', id); 
    if (error) alert('削除エラー: ' + error.message)
    else fetchData();
  }

  const addData = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDates.length === 0 || !categoryId) return alert('日付またはカテゴリが選択されていません。')

    if (modalType === 'schedule') {
      if (!scheduleTitle.trim()) return
      if (scheduleMode === 'weekly' && scheduleEndDate && selectedDates.length === 1) {
        const targetDate = selectedDates[0]
        const { data: recData, error: recError } = await supabase.from('recurring_schedules').insert([{
          user_id: userId, start_date: targetDate, end_date: scheduleEndDate, day_of_week: new Date(targetDate).getDay()
        }]).select()
        if (recError) return alert('定期ルール作成エラー: ' + recError.message)
        
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
        const { error } = await supabase.from('schedules').insert(scheduleInserts)
        if (error) return alert('予定の登録に失敗しました: ' + error.message)
      } else {
        const scheduleInserts = selectedDates.map(dateStr => {
          const startDateTime = isAllDay ? `${dateStr}T00:00:00+09:00` : `${dateStr}T${startTime}:00+09:00`
          const endDateTime = isAllDay ? `${dateStr}T23:59:59+09:00` : `${dateStr}T${endTime}:00+09:00`
          return { user_id: userId, category_id: categoryId, title: scheduleTitle, start_time: startDateTime, end_time: endDateTime, is_all_day: isAllDay }
        })
        const { error } = await supabase.from('schedules').insert(scheduleInserts)
        if (error) return alert('予定の登録に失敗しました: ' + error.message)
      }
      setScheduleTitle(''); setScheduleMode('single'); setScheduleEndDate('');
    } else {
      const numAmount = Number(amountStr)
      if (numAmount <= 0 || isNaN(numAmount)) return alert('エラー：金額は1以上の数値を入力してください。')

      if (editingTxId) {
        const { error } = await supabase.from('finance_transactions').update({
          amount: numAmount, category_id: categoryId, type: modalType
        }).eq('id', editingTxId)
        if (error) return alert('収支の更新に失敗しました: ' + error.message)
        setEditingTxId(null)
      } else {
        if (isRecurring) {
          const ruleInserts = selectedDates.map(dateStr => ({
            user_id: userId, category_id: categoryId, type: modalType, amount: numAmount, day_of_month: parseInt(dateStr.split('-')[2], 10)
          }))
          const { error: rError } = await supabase.from('finance_recurring_rules').insert(ruleInserts)
          if (rError) alert('定期ルールの登録に失敗しました: ' + rError.message)
        }
        const txInserts = selectedDates.map(dateStr => ({
          user_id: userId, category_id: categoryId, type: modalType, amount: numAmount, transaction_date: dateStr
        }))
        const { error } = await supabase.from('finance_transactions').insert(txInserts)
        if (error) return alert('収支の登録に失敗しました: ' + error.message)
      }
      setAmountStr('')
    }
    
    setIsRecurring(false); setIsModalOpen(false); setSelectedDates([]); fetchData();
  }

  // =====================
  // 予定編集・削除処理
  // =====================
  const startEditSchedule = () => {
    if (!selectedSchedule) return
    setEditSchTitle(selectedSchedule.title)
    setEditSchIsAllDay(selectedSchedule.is_all_day)
    setEditSchStart(formatLocalTime(selectedSchedule.start_time))
    setEditSchEnd(formatLocalTime(selectedSchedule.end_time))
    setEditSchCatId(selectedSchedule.category_id)
    setIsEditingSchedule(true)
  }

  const saveEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSchedule || !editSchTitle.trim()) return
    const dateStr = selectedSchedule.start_time.substring(0, 10)
    const startDateTime = editSchIsAllDay ? `${dateStr}T00:00:00+09:00` : `${dateStr}T${editSchStart}:00+09:00`
    const endDateTime = editSchIsAllDay ? `${dateStr}T23:59:59+09:00` : `${dateStr}T${editSchEnd}:00+09:00`

    const { error } = await supabase.from('schedules').update({
      title: editSchTitle, start_time: startDateTime, end_time: endDateTime, is_all_day: editSchIsAllDay, category_id: editSchCatId
    }).eq('id', selectedSchedule.id)

    if (error) return alert('予定の更新に失敗しました: ' + error.message)
    setIsEditingSchedule(false); setSelectedSchedule(null); fetchData();
  }

  const deleteSchedule = async (type: 'single' | 'future') => {
    if (!selectedSchedule) return
    if (type === 'single') {
      const { error } = await supabase.from('schedules').delete().eq('id', selectedSchedule.id)
      if (error) alert('削除エラー: ' + error.message)
    }
    else if (type === 'future' && selectedSchedule.recurring_id) {
      const { error } = await supabase.from('schedules').delete().eq('recurring_id', selectedSchedule.recurring_id).gte('start_time', selectedSchedule.start_time)
      if (error) alert('削除エラー: ' + error.message)
    }
    setSelectedSchedule(null); fetchData();
  }

  // =====================
  // カレンダー描画用
  // =====================
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
    <main className="min-h-screen bg-[#87CEFA]/30 p-2 md:p-8 flex flex-col xl:flex-row gap-4 md:gap-6 relative pb-32 font-sans">
      {/* -------------------- カレンダーエリア -------------------- */}
      <section className="flex-1 bg-[#F0F8FF] p-2 md:p-6 rounded-xl shadow-xl border-2 border-[#87CEFA] text-[#0000CD] flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="px-3 py-1.5 md:px-4 md:py-2 bg-[#00BFFF] text-white rounded hover:bg-[#0000CD] font-bold shadow-md transition-colors text-sm md:text-base">先月</button>
            <h2 className="text-xl md:text-3xl font-extrabold">{currentDate.getFullYear()}/{String(currentDate.getMonth() + 1).padStart(2, '0')}</h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="px-3 py-1.5 md:px-4 md:py-2 bg-[#00BFFF] text-white rounded hover:bg-[#0000CD] font-bold shadow-md transition-colors text-sm md:text-base">来月</button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => { setIsMultiSelectMode(!isMultiSelectMode); setSelectedDates([]); }} className={`px-2 py-1 md:px-4 md:py-2 rounded font-bold text-xs md:text-sm shadow-md transition-colors border-2 ${isMultiSelectMode ? 'bg-[#0000CD] text-white border-[#0000CD]' : 'bg-white text-[#00BFFF] border-[#00BFFF] hover:bg-[#87CEFA]/20'}`}>
              複数選択: {isMultiSelectMode ? 'ON' : 'OFF'}
            </button>
            {isMultiSelectMode && selectedDates.length > 0 && (
              <button onClick={() => setIsModalOpen(true)} className="px-2 py-1 md:px-4 md:py-2 bg-[#FF3356] text-white rounded font-bold text-xs md:text-sm shadow-md animate-bounce border-2 border-[#FF3356]">
                {selectedDates.length}日分を登録
              </button>
            )}
            <button onClick={() => supabase.auth.signOut()} className="px-2 py-1 md:px-4 md:py-2 bg-white text-[#BA0200] border-2 border-[#BA0200] rounded font-bold text-xs md:text-sm hover:bg-[#BA0200] hover:text-white transition-colors whitespace-nowrap shadow-md">
              ログアウト
            </button>
          </div>
        </div>

        <div className="pb-2 md:pb-4 flex-1 w-full [container-type:inline-size]">
          <div className="w-[105%] -ml-[2.5%]">
            <div className="grid grid-cols-7 gap-0.5 md:gap-2 text-center font-bold mb-1 md:mb-2 text-[2.45cqi] md:text-[11px]">
              <div className="text-[#FF3356]">日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div className="text-[#00BFFF]">土</div>
            </div>
            <div className="grid grid-cols-7 gap-[2px] md:gap-2">
              {getDaysInMonth().map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="aspect-[21/33] md:aspect-auto md:min-h-[154px] bg-[#87CEFA]/10 rounded-sm md:rounded" />
                const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                
                const dailyTx = transactions.filter(t => t.transaction_date === dateString)
                const dIncome = dailyTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
                const dExpense = dailyTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                
                const dailySchedules = schedules.filter(s => getLocalYYYYMMDD(new Date(s.start_time)) === dateString).sort((a, b) => {
                  if (a.is_all_day && !b.is_all_day) return -1
                  if (!a.is_all_day && b.is_all_day) return 1
                  return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                })
                
                const isSelected = selectedDates.includes(dateString)
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                const dayOfWeek = dateObj.getDay()
                const isToday = dateString === todayString
                
                // 本日の日付は目立つ太枠に変更
                let borderClass = 'border-[1px] md:border-2 border-[#87CEFA]'
                if (isToday) borderClass = 'border-[3px] md:border-[4px] border-[#0000CD] shadow-[0_0_8px_rgba(0,0,205,0.6)] z-10 relative'
                else if (HOLIDAYS.includes(dateString)) borderClass = 'border-[2px] md:border-4 border-[#BA0200] md:shadow-[0_0_10px_rgba(186,2,0,0.3)]'
                else if (dayOfWeek === 0) borderClass = 'border-[2px] md:border-4 border-[#FF3356] md:shadow-[0_0_10px_rgba(255,51,86,0.3)]'
                else if (dayOfWeek === 6) borderClass = 'border-[2px] md:border-4 border-[#3DFFF3] md:shadow-[0_0_10px_rgba(61,255,243,0.3)]'

                return (
                  <div 
                    key={day} 
                    onClick={() => handleDateClick(dateString)}
                    className={`aspect-[21/33] md:aspect-auto md:min-h-[154px] rounded-sm md:rounded p-[0.5cqi] md:p-1.5 flex flex-col transition-all cursor-pointer overflow-hidden bg-white ${borderClass} ${isSelected ? 'ring-2 md:ring-4 ring-[#0000CD] bg-[#87CEFA]/20 transform scale-95' : 'hover:shadow-lg hover:bg-[#F0F8FF]'}`}
                  >
                    <span className={`font-bold ml-[0.5cqi] md:ml-1 text-[2.8cqi] md:text-[11px] leading-none mt-[0.5cqi] md:mt-0 ${dayOfWeek === 0 || HOLIDAYS.includes(dateString) ? 'text-[#FF3356]' : dayOfWeek === 6 ? 'text-[#00BFFF]' : 'text-[#0000CD]'}`}>{day}</span>
                    <div className="flex flex-col gap-[0.5cqi] md:gap-1 mt-[1cqi] md:mt-1">
                      {dailySchedules.map(sch => {
                        const catColor = categories.find(c => c.id === sch.category_id)?.color_code || '#cccccc'
                        return (
                          <div 
                            key={sch.id} 
                            onClick={(e) => { e.stopPropagation(); setSelectedSchedule(sch); }}
                            className="text-[1.82cqi] md:text-[8.4px] leading-[1.2] md:leading-normal px-[1cqi] md:px-1.5 py-[0.5cqi] md:py-0.5 rounded-sm md:rounded truncate cursor-pointer hover:opacity-80 font-semibold shadow-sm"
                            style={{ backgroundColor: catColor, color: getContrastTextColor(catColor) }}
                          >
                            {sch.is_all_day ? '終日' : formatLocalTime(sch.start_time)} {sch.title}
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-auto flex flex-col items-end text-[1.82cqi] md:text-[8.4px] font-bold w-full pt-[0.5cqi] md:pt-1">
                      {dIncome > 0 && <span className="text-[#0000CD] bg-[#87CEFA]/30 px-[1cqi] md:px-1 rounded-sm md:rounded mb-[0.5cqi] md:mb-0.5 truncate max-w-full">+{dIncome}</span>}
                      {dExpense > 0 && <span className="text-[#FF3356] bg-[#FF3356]/10 px-[1cqi] md:px-1 rounded-sm md:rounded truncate max-w-full">-{dExpense}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- ToDoエリア -------------------- */}
      <section className="w-full xl:w-[400px] bg-[#F0F8FF] p-4 md:p-6 rounded-xl shadow-xl border-2 border-[#87CEFA] text-[#0000CD] flex flex-col">
        <h2 className="text-lg md:text-xl font-bold mb-4 border-b-2 border-[#00BFFF] pb-2">ToDoリスト</h2>
        <form onSubmit={submitTodo} className="flex flex-col gap-2 mb-4 bg-white p-3 rounded border border-[#87CEFA]">
          <input type="text" value={todoTitle} onChange={e => setTodoTitle(e.target.value)} placeholder="タスク名" required className="border-2 border-[#87CEFA] p-2 rounded focus:border-[#00BFFF] focus:outline-none text-sm md:text-base" />
          <input type="date" value={todoDueDate} onChange={e => setTodoDueDate(e.target.value)} className="border-2 border-[#87CEFA] p-2 rounded focus:border-[#00BFFF] focus:outline-none text-sm md:text-base" />
          <select value={todoPriority} onChange={e => setTodoPriority(Number(e.target.value))} className="border-2 border-[#87CEFA] p-2 rounded focus:border-[#00BFFF] focus:outline-none font-bold text-sm md:text-base">
            {[5,4,3,2,1].map(p => <option key={p} value={p}>優先度 {p}</option>)}
          </select>
          <div className="flex gap-2">
            {editingTodoId && <button type="button" onClick={cancelEditTodo} className="flex-1 bg-gray-200 text-gray-700 p-2 rounded font-bold hover:bg-gray-300 transition-colors">キャンセル</button>}
            <button type="submit" className={`flex-1 text-white p-2 rounded font-bold shadow-md transition-colors ${editingTodoId ? 'bg-[#0000CD]' : 'bg-[#00BFFF] hover:bg-[#0000CD]'}`}>
              {editingTodoId ? '更新' : '追加'}
            </button>
          </div>
        </form>
        <ul className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {todos.map(todo => (
            <li key={todo.id} className="flex justify-between items-center p-2 md:p-3 border border-[#87CEFA] rounded shadow-sm bg-white" style={{ borderLeft: `8px solid ${PRIORITY_COLORS[todo.priority]}` }}>
              <div className="flex items-start gap-2 md:gap-3 flex-1">
                <input type="checkbox" checked={todo.is_completed} onChange={() => toggleTodo(todo.id, todo.is_completed)} className="w-4 h-4 md:w-5 md:h-5 mt-0.5 cursor-pointer accent-[#00BFFF]"/>
                <div className="flex flex-col flex-1">
                  <span className={`font-bold text-sm md:text-base break-words ${todo.is_completed ? 'line-through text-gray-400' : 'text-[#0000CD]'}`}>{todo.title}</span>
                  <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow-sm whitespace-nowrap" style={{ backgroundColor: PRIORITY_COLORS[todo.priority] }}>優先度 {todo.priority}</span>
                    {todo.due_date && <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">期日: {todo.due_date.replace(/-/g, '/')}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0 ml-2">
                <button onClick={() => editTodo(todo)} className="text-[#00BFFF] text-xs md:text-sm font-bold hover:underline whitespace-nowrap text-right">編集</button>
                <button onClick={() => deleteTodo(todo.id)} className="text-[#FF3356] text-xs md:text-sm font-bold hover:underline whitespace-nowrap text-right">削除</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* -------------------- 貯金額表示 -------------------- */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 p-3 md:p-4 rounded-xl shadow-2xl border-4 font-bold text-base md:text-lg z-40 transform hover:scale-105 transition-transform" style={{ backgroundColor: savingsBgColor, color: savingsTextColor, borderColor: savingsTextColor }}>
        <div className="text-[10px] md:text-xs opacity-90 mb-0.5 md:mb-1">今月のトータル貯金額</div>
        {monthlySavings > 0 ? '+' : ''}{monthlySavings.toLocaleString()} 円
      </div>

      {/* -------------------- カテゴリ管理モーダル -------------------- */}
      {isManageCatModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#F0F8FF] p-4 md:p-6 rounded-xl w-full max-w-[400px] shadow-2xl border-2 border-[#00BFFF] max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-bold text-[#0000CD]">カテゴリの管理</h3>
              <button onClick={() => setIsManageCatModalOpen(false)} className="text-gray-500 hover:text-[#FF3356] font-bold text-2xl">&times;</button>
            </div>
            
            <div className="mb-4 bg-white p-3 rounded border border-[#87CEFA] shrink-0">
              <h4 className="text-sm font-bold text-[#0000CD] mb-2">新規作成</h4>
              <div className="flex flex-col gap-2">
                <input type="text" placeholder="カテゴリ名" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="border-2 border-[#87CEFA] p-2 rounded text-sm w-full focus:outline-none focus:border-[#00BFFF]" />
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_COLORS.map(c => <div key={c.code} onClick={() => setNewCatColor(c.code)} className={`w-6 h-6 rounded-full cursor-pointer border-2 ${newCatColor === c.code ? 'border-[#0000CD] scale-110' : 'border-transparent'}`} style={{backgroundColor: c.code}} title={c.name} />)}
                </div>
                <button type="button" onClick={addCategory} className="bg-[#00BFFF] text-white p-2 rounded text-sm font-bold shadow-md hover:bg-[#0000CD]">追加</button>
              </div>
            </div>

            <h4 className="text-sm font-bold text-[#0000CD] mb-2 shrink-0">並び替え (矢印タップで移動)</h4>
            <ul className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {categories.filter(c => c.type === modalType).map((c, index, arr) => (
                <li key={c.id} className="flex justify-between items-center bg-white p-2 border-2 border-[#87CEFA] rounded hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1 mr-1">
                      <button onClick={() => moveCategory(index, 'up')} disabled={index === 0} className={`text-lg leading-none ${index === 0 ? 'text-gray-200' : 'text-[#00BFFF] hover:text-[#0000CD] active:scale-90'}`}>▲</button>
                      <button onClick={() => moveCategory(index, 'down')} disabled={index === arr.length - 1} className={`text-lg leading-none ${index === arr.length - 1 ? 'text-gray-200' : 'text-[#00BFFF] hover:text-[#0000CD] active:scale-90'}`}>▼</button>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c.color_code }} />
                    <span className="font-bold text-[#0000CD] text-sm md:text-base">{c.name}</span>
                  </div>
                  <button onClick={() => deleteCategory(c.id)} className="text-[#FF3356] text-xs font-bold px-2 py-1 bg-[#FF3356]/10 rounded hover:bg-[#FF3356] hover:text-white transition-colors">削除</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* -------------------- 登録・一括操作モーダル -------------------- */}
      {isModalOpen && selectedDates.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F0F8FF] p-4 md:p-6 rounded-xl w-full max-w-[400px] shadow-2xl border-2 border-[#00BFFF] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-bold text-[#0000CD]">{selectedDates.length === 1 ? selectedDates[0].replace(/-/g, '/') : `${selectedDates.length}日分の選択`}</h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-[#FF3356] font-bold text-2xl">&times;</button>
            </div>
            
            {/* この日の収支記録 */}
            {selectedDates.length === 1 && selectedDayTransactions.length > 0 && (
              <div className="mb-4 md:mb-6 bg-white p-3 rounded border-2 border-[#87CEFA] shadow-inner">
                <h4 className="font-bold text-sm mb-2 text-[#0000CD] border-b-2 border-[#87CEFA] pb-1">この日の収支記録</h4>
                <div className="space-y-2">
                  {selectedDayTransactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1">
                      <div className="flex-1">
                        <span className={`font-bold mr-2 ${tx.type === 'income' ? 'text-[#0000CD]' : 'text-[#FF3356]'}`}>{tx.type === 'income' ? '収入' : '支出'}</span>
                        <span className="text-gray-700 font-semibold">{categories.find(c => c.id === tx.category_id)?.name}</span>
                        <span className="font-bold ml-2 text-black">{tx.amount.toLocaleString()}円</span>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEditTransaction(tx)} className="text-[#00BFFF] text-xs font-bold hover:underline p-1">編集</button>
                        <button type="button" onClick={() => deleteTransaction(tx.id)} className="text-[#FF3356] text-xs font-bold hover:underline p-1">削除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* モーダルタブ */}
            <div className="flex gap-1 mb-4 p-1 bg-[#87CEFA]/30 rounded-lg">
              <button onClick={() => { setModalType('schedule'); setEditingTxId(null); }} className={`flex-1 py-2 rounded text-xs md:text-sm font-bold transition-colors ${modalType === 'schedule' ? 'bg-[#0000CD] text-white shadow-md' : 'text-[#0000CD] hover:bg-white/50'}`}>予定</button>
              <button onClick={() => { setModalType('income'); setEditingTxId(null); }} className={`flex-1 py-2 rounded text-xs md:text-sm font-bold transition-colors ${modalType === 'income' ? 'bg-[#00BFFF] text-white shadow-md' : 'text-[#0000CD] hover:bg-white/50'}`}>収入</button>
              <button onClick={() => { setModalType('expense'); setEditingTxId(null); }} className={`flex-1 py-2 rounded text-xs md:text-sm font-bold transition-colors ${modalType === 'expense' ? 'bg-[#FF3356] text-white shadow-md' : 'text-[#0000CD] hover:bg-white/50'}`}>支出</button>
            </div>
            
            {/* メインフォーム */}
            <form onSubmit={addData} className="flex flex-col gap-4">
              {modalType === 'schedule' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-[#0000CD]">予定のタイトル</label>
                    <input type="text" value={scheduleTitle} onChange={e => setScheduleTitle(e.target.value)} required className="border-2 border-[#87CEFA] p-2 rounded w-full focus:outline-none focus:border-[#00BFFF] font-bold text-base" />
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2 rounded border border-[#87CEFA]">
                    <input type="checkbox" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} id="allday" className="w-5 h-5 cursor-pointer accent-[#00BFFF]"/>
                    <label htmlFor="allday" className="text-sm cursor-pointer font-bold text-[#0000CD]">終日</label>
                  </div>
                  {!isAllDay && (
                    <div className="flex gap-2 items-center bg-white p-2 rounded border border-[#87CEFA]">
                      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} step="300" required className="border-2 border-[#87CEFA] p-2 rounded flex-1 focus:outline-none focus:border-[#00BFFF] font-bold text-base" />
                      <span className="font-bold text-[#0000CD]">〜</span>
                      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} step="300" required className="border-2 border-[#87CEFA] p-2 rounded flex-1 focus:outline-none focus:border-[#00BFFF] font-bold text-base" />
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
                          <input type="date" value={scheduleEndDate} min={selectedDates[0]} onChange={e => setScheduleEndDate(e.target.value)} required className="border-2 border-[#87CEFA] p-2 rounded text-sm w-full focus:outline-none focus:border-[#00BFFF] font-bold" />
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
                  {!editingTxId && (
                    <div className="flex items-center gap-2 bg-white p-2 rounded border border-[#87CEFA]">
                      <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} id="recurring" className="w-5 h-5 cursor-pointer accent-[#00BFFF]"/>
                      <label htmlFor="recurring" className="text-xs cursor-pointer text-[#0000CD] font-bold">毎月選択した日に固定費として自動登録する</label>
                    </div>
                  )}
                </>
              )}
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-bold text-[#0000CD]">カテゴリ</label>
                  <button type="button" onClick={() => setIsManageCatModalOpen(true)} className="text-xs text-[#00BFFF] font-bold hover:underline bg-white px-2 py-1 rounded border border-[#87CEFA] shadow-sm">管理・並び替え</button>
                </div>
                
                <div className="relative">
                  <div 
                    onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)} 
                    className="border-2 border-[#87CEFA] p-3 rounded w-full flex items-center justify-between cursor-pointer bg-white hover:border-[#00BFFF] transition-colors"
                  >
                    {categoryId ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full shadow-inner border border-gray-200 shrink-0" style={{ backgroundColor: categories.find(c => c.id === categoryId)?.color_code }} />
                        <span className="font-bold text-[#0000CD] text-base md:text-lg truncate">{categories.find(c => c.id === categoryId)?.name}</span>
                      </div>
                    ) : <span className="text-gray-400 font-bold">カテゴリを選択</span>}
                    <span className="text-[#00BFFF] text-xs font-bold ml-2">▼</span>
                  </div>
                  
                  {isCatDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-[#00BFFF] rounded shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                      {categories.filter(c => c.type === modalType).map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => { setCategoryId(c.id); setIsCatDropdownOpen(false); }}
                          className="flex items-center gap-3 p-3 hover:bg-[#F0F8FF] cursor-pointer border-b border-gray-100 last:border-0"
                        >
                          <div className="w-5 h-5 rounded-full shadow-inner border border-gray-200 shrink-0" style={{ backgroundColor: c.color_code }} />
                          <span className="font-bold text-[#0000CD] truncate">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-2 md:mt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-white text-[#0000CD] border-2 border-[#87CEFA] p-3 rounded font-bold hover:bg-[#87CEFA]/20 transition-colors shadow-md">閉じる</button>
                <button type="submit" className={`flex-1 text-white p-3 rounded font-bold shadow-md text-base md:text-lg transition-colors ${editingTxId ? 'bg-[#0000CD]' : 'bg-[#00BFFF] hover:bg-[#0000CD]'}`}>
                  {editingTxId ? '更新' : '登録'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- 予定の詳細・編集モーダル -------------------- */}
      {selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F0F8FF] p-6 rounded-xl w-full max-w-80 shadow-2xl border-2 border-[#00BFFF] max-h-[90vh] overflow-y-auto">
            {isEditingSchedule ? (
              <form onSubmit={saveEditSchedule} className="flex flex-col gap-4">
                <h3 className="text-lg md:text-xl font-bold text-[#0000CD] border-b-2 border-[#00BFFF] pb-2">予定の編集</h3>
                <div>
                  <label className="block text-sm font-bold mb-1 text-[#0000CD]">タイトル</label>
                  <input type="text" value={editSchTitle} onChange={e => setEditSchTitle(e.target.value)} required className="border-2 border-[#87CEFA] p-2 rounded w-full focus:outline-none focus:border-[#00BFFF] font-bold text-base" />
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded border border-[#87CEFA]">
                  <input type="checkbox" checked={editSchIsAllDay} onChange={e => setEditSchIsAllDay(e.target.checked)} id="edit-allday" className="w-5 h-5 cursor-pointer accent-[#00BFFF]"/>
                  <label htmlFor="edit-allday" className="text-sm cursor-pointer font-bold text-[#0000CD]">終日</label>
                </div>
                {!editSchIsAllDay && (
                  <div className="flex gap-2 items-center bg-white p-2 rounded border border-[#87CEFA]">
                    <input type="time" value={editSchStart} onChange={e => setEditSchStart(e.target.value)} step="300" required className="border-2 border-[#87CEFA] p-2 rounded flex-1 focus:outline-none focus:border-[#00BFFF] font-bold" />
                    <span className="font-bold text-[#0000CD]">〜</span>
                    <input type="time" value={editSchEnd} onChange={e => setEditSchEnd(e.target.value)} step="300" required className="border-2 border-[#87CEFA] p-2 rounded flex-1 focus:outline-none focus:border-[#00BFFF] font-bold" />
                  </div>
                )}
                <div className="relative">
                  <label className="block text-sm font-bold mb-1 text-[#0000CD]">カテゴリ</label>
                  <div onClick={() => setIsEditCatDropdownOpen(!isEditCatDropdownOpen)} className="border-2 border-[#87CEFA] p-3 rounded w-full flex items-center justify-between cursor-pointer bg-white hover:border-[#00BFFF] transition-colors">
                    {editSchCatId ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full shadow-inner border border-gray-200 shrink-0" style={{ backgroundColor: categories.find(c => c.id === editSchCatId)?.color_code }} />
                        <span className="font-bold text-[#0000CD] text-base truncate">{categories.find(c => c.id === editSchCatId)?.name}</span>
                      </div>
                    ) : <span className="text-gray-400 font-bold">カテゴリを選択</span>}
                    <span className="text-[#00BFFF] text-xs font-bold ml-2">▼</span>
                  </div>
                  {isEditCatDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-[#00BFFF] rounded shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                      {categories.filter(c => c.type === 'schedule').map(c => (
                        <div key={c.id} onClick={() => { setEditSchCatId(c.id); setIsEditCatDropdownOpen(false); }} className="flex items-center gap-3 p-3 hover:bg-[#F0F8FF] cursor-pointer border-b border-gray-100 last:border-0">
                          <div className="w-5 h-5 rounded-full shadow-inner border border-gray-200 shrink-0" style={{ backgroundColor: c.color_code }} />
                          <span className="font-bold text-[#0000CD] truncate">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => setIsEditingSchedule(false)} className="flex-1 bg-gray-200 text-gray-700 p-2 rounded font-bold hover:bg-gray-300 transition-colors">キャンセル</button>
                  <button type="submit" className="flex-1 bg-[#0000CD] text-white p-2 rounded font-bold shadow-md">更新</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: categories.find(c => c.id === selectedSchedule.category_id)?.color_code }} />
                    <h3 className="text-lg md:text-xl font-extrabold text-[#0000CD] break-words">{selectedSchedule.title}</h3>
                  </div>
                  <button onClick={startEditSchedule} className="text-[#00BFFF] font-bold text-sm hover:underline shrink-0">編集</button>
                </div>
                <p className="text-sm mb-6 text-[#00BFFF] font-bold border-b-2 border-[#87CEFA] pb-2 inline-block">
                  {selectedSchedule.is_all_day ? '終日' : `${formatLocalTime(selectedSchedule.start_time)} 〜 ${formatLocalTime(selectedSchedule.end_time)}`}
                </p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => deleteSchedule('single')} className="w-full bg-white text-[#FF3356] border-2 border-[#FF3356] p-3 md:p-2 rounded font-bold hover:bg-[#FF3356] hover:text-white transition-colors shadow-md text-sm md:text-base">この予定のみ削除</button>
                  {selectedSchedule.recurring_id && <button onClick={() => deleteSchedule('future')} className="w-full bg-[#BA0200] text-white p-3 md:p-2 rounded font-bold hover:bg-black transition-colors shadow-md text-sm md:text-base">これ以降の定期予定も削除</button>}
                  <button onClick={() => setSelectedSchedule(null)} className="w-full bg-white text-[#0000CD] border-2 border-[#87CEFA] p-3 md:p-2 rounded font-bold hover:bg-[#87CEFA]/20 transition-colors shadow-md mt-2 text-sm md:text-base">閉じる</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}