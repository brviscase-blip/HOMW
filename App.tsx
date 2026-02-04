
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, TaskStatus, TaskHistory, TaskType } from './types';
import { Icons, CATEGORIES, DAYS_OF_WEEK } from './constants';
import { supabase } from './supabaseClient';

type Tab = 'tasks';
type SubTab = 'today' | 'registry';
type Theme = 'light' | 'dark';

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Mapeamento DB -> UI
const mapTaskFromDB = (db: any): Task => ({
  id: db.id,
  title: db.title,
  description: db.description || '',
  priority: db.priority as Priority,
  status: db.status as TaskStatus,
  category: db.category || '',
  dueDate: db.due_date,
  days: db.days,
  createdAt: db.created_at,
  icon: db.icon || 'List',
  iconColor: db.icon_color || '#0f172a',
  targetReps: db.target_reps,
  currentReps: db.current_reps,
  type: db.type as TaskType,
  history: db.history || {}
});

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [subTab, setSubTab] = useState<SubTab>('today');
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('zenflow_theme');
    return (saved as Theme) || 'light';
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, task: Task } | null>(null);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(formatLocalDate(new Date()));
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [targetReps, setTargetReps] = useState<number>(1);
  const [taskType, setTaskType] = useState<TaskType>(TaskType.DAILY);

  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [selectedViewDate, setSelectedViewDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  const fetchTasks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar tarefas:', error);
    } else if (data) {
      setTasks(data.map(mapTaskFromDB));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    localStorage.setItem('zenflow_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const realTodayStr = useMemo(() => formatLocalDate(new Date()), []);
  const viewDateStr = useMemo(() => formatLocalDate(selectedViewDate), [selectedViewDate]);
  const viewDayName = useMemo(() => DAYS_OF_WEEK[selectedViewDate.getDay()], [selectedViewDate]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
      days.push(null);
    }
    
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    
    return days;
  }, [viewDate]);

  const filteredTasks = useMemo(() => {
    if (subTab === 'today') {
      return tasks.filter(t => {
        const dayState = (t.history && t.history[viewDateStr]) || null;
        
        if (t.type === TaskType.TASK) {
          if (dayState && dayState.status === TaskStatus.COMPLETED) return true;
          return t.status === TaskStatus.TODO;
        }

        const isOnOrAfterStartDate = viewDateStr >= t.dueDate;
        if (!isOnOrAfterStartDate) return false;

        const isTargetDate = t.dueDate === viewDateStr;
        const isTargetDay = t.days && t.days.includes(viewDayName);
        
        return isTargetDate || isTargetDay;
      });
    }
    return tasks;
  }, [tasks, subTab, viewDateStr, viewDayName]);

  const isFormValid = useMemo(() => {
    return title.trim() !== '';
  }, [title]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleOpenNewTask = () => {
    setEditingTaskId(null);
    setTitle('');
    setDueDate(formatLocalDate(new Date()));
    setSelectedDays([]);
    setTargetReps(1);
    setTaskType(TaskType.DAILY);
    setIsModalOpen(true);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    const newTaskData = {
      title: quickTaskTitle,
      description: '',
      priority: Priority.MEDIUM, 
      status: TaskStatus.TODO,
      category: CATEGORIES[0].name, 
      due_date: viewDateStr,
      icon: 'List',
      icon_color: '#06b6d4', 
      target_reps: 1,
      current_reps: 0,
      type: TaskType.TASK,
      history: {}
    };

    const { data, error } = await supabase.from('tasks').insert([newTaskData]).select();
    
    if (error) {
      console.error('Erro ao adicionar rápida:', error);
    } else if (data) {
      setTasks(prev => [mapTaskFromDB(data[0]), ...prev]);
      setQuickTaskTitle('');
    }
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDueDate(task.dueDate);
    setSelectedDays(task.days || []);
    setTargetReps(task.targetReps);
    setTaskType(task.type || TaskType.DAILY);
    setIsModalOpen(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    if (editingTaskId) {
      const updatedData: any = {
        title,
        due_date: dueDate,
        days: taskType === TaskType.TASK ? null : (selectedDays.length > 0 ? selectedDays : null),
        target_reps: taskType === TaskType.TASK ? 1 : Math.max(1, targetReps),
        type: taskType
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(updatedData)
        .eq('id', editingTaskId)
        .select();

      if (error) {
        console.error('Erro ao atualizar:', error);
      } else if (data) {
        setTasks(prev => prev.map(t => t.id === editingTaskId ? mapTaskFromDB(data[0]) : t));
      }
    } else {
      const newTaskData = {
        title: title,
        description: '',
        priority: Priority.MEDIUM, 
        status: TaskStatus.TODO,
        category: CATEGORIES[0].name, 
        due_date: dueDate,
        days: taskType === TaskType.TASK ? null : (selectedDays.length > 0 ? selectedDays : null),
        icon: 'List',
        icon_color: '#0f172a',
        target_reps: taskType === TaskType.TASK ? 1 : Math.max(1, targetReps),
        current_reps: 0,
        type: taskType,
        history: {}
      };

      const { data, error } = await supabase.from('tasks').insert([newTaskData]).select();
      
      if (error) {
        console.error('Erro ao criar:', error);
      } else if (data) {
        setTasks(prev => [mapTaskFromDB(data[0]), ...prev]);
      }
    }

    setIsModalOpen(false);
    setIsCalendarOpen(false);
    setEditingTaskId(null);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleTaskStatus = async (id: string) => {
    if (subTab !== 'today') return;
    
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const history = task.history || {};
    const currentDayState: TaskHistory = history[viewDateStr] || { currentReps: 0, status: TaskStatus.TODO };
    
    let nextReps = 0;
    let nextStatus = TaskStatus.TODO;

    if (currentDayState.status === TaskStatus.COMPLETED) {
      nextReps = 0;
      nextStatus = TaskStatus.TODO;
    } else {
      if (task.targetReps > 1) {
        nextReps = (currentDayState.currentReps || 0) + 1;
        if (nextReps >= task.targetReps) {
          nextReps = task.targetReps;
          nextStatus = TaskStatus.COMPLETED;
        } else {
          nextStatus = TaskStatus.TODO;
        }
      } else {
        nextReps = 1;
        nextStatus = TaskStatus.COMPLETED;
      }
    }

    const globalStatus = (task.type === TaskType.TASK) ? nextStatus : task.status;
    const newHistory = { ...history, [viewDateStr]: { currentReps: nextReps, status: nextStatus } };

    const { data, error } = await supabase
      .from('tasks')
      .update({ status: globalStatus, history: newHistory })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao alternar status:', error);
    } else if (data) {
      setTasks(prev => prev.map(t => t.id === id ? mapTaskFromDB(data[0]) : t));
    }
  };

  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      const { error } = await supabase.from('tasks').delete().eq('id', taskToDelete.id);
      
      if (error) {
        console.error('Erro ao deletar:', error);
      } else {
        setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
        setTaskToDelete(null);
        setIsDeleteModalOpen(false);
      }
    }
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const isDaySelectable = (date: Date) => {
    if (selectedDays.length === 0) return true;
    const dayName = DAYS_OF_WEEK[date.getDay()];
    return selectedDays.includes(dayName);
  };

  const navigateDay = (offset: number) => {
    const newDate = new Date(selectedViewDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedViewDate(newDate);
  };

  const resetToToday = () => {
    setSelectedViewDate(new Date());
  };

  const SectionLabel = ({ number, text }: { number: string, text: string }) => (
    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.15em] flex items-center gap-3">
      <span className="w-1.5 h-1.5 bg-slate-950 dark:bg-white"></span> {number}. {text}
    </label>
  );

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const dayState = (task.history && task.history[viewDateStr]) || { currentReps: 0, status: TaskStatus.TODO };
    const showAsCompleted = subTab === 'today' && dayState.status === TaskStatus.COMPLETED;
    const progressPercent = task.targetReps > 1 ? (dayState.currentReps / task.targetReps) * 100 : 0;

    const getTypeColor = () => {
      switch(task.type) {
        case TaskType.HABIT: return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400';
        case TaskType.DAILY: return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
        case TaskType.TASK: return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400';
        default: return '';
      }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      if (task.type === TaskType.TASK || subTab === 'registry') {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, task });
      }
    };

    return (
      <div 
        onContextMenu={handleContextMenu}
        className={`group relative flex items-start md:items-center gap-4 md:gap-6 p-4 md:p-6 transition-all border-l-4 border-transparent overflow-hidden ${showAsCompleted ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-l-emerald-500' : 'hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-l-slate-950 dark:hover:border-l-white'}`}
      >
        {subTab === 'today' && (
          <div className="flex flex-col items-center justify-center z-20">
            <button 
              onClick={() => toggleTaskStatus(task.id)} 
              title={showAsCompleted ? "Clique para desfazer tudo" : "Clique para registrar progresso"}
              className={`w-10 h-10 md:w-11 md:h-11 shrink-0 border-2 flex flex-col items-center justify-center transition-all relative overflow-hidden ${dayState.status === TaskStatus.COMPLETED ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'} hover:border-emerald-500 dark:hover:border-emerald-400 cursor-pointer`}
            >
              {/* Camada de Preenchimento de Progresso (Dentro da caixa de ação) */}
              {!showAsCompleted && task.targetReps > 1 && progressPercent > 0 && (
                <div 
                  className="absolute bottom-0 left-0 w-full bg-emerald-500/40 dark:bg-emerald-400/60 transition-all duration-300 pointer-events-none" 
                  style={{ height: `${progressPercent}%` }}
                />
              )}
              
              <div className="relative z-10">
                {dayState.status === TaskStatus.COMPLETED ? <Icons.Check /> : <Icons.Plus />}
              </div>
            </button>
          </div>
        )}
        <div className="flex-1 min-w-0 z-10">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
             <h4 className={`text-sm md:text-base font-bold tracking-tight truncate transition-all ${showAsCompleted ? 'line-through text-emerald-800 dark:text-emerald-400 opacity-60' : 'text-slate-950 dark:text-white'}`}>{task.title}</h4>
             {showAsCompleted && <span className="hidden md:inline-block text-[7px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 tracking-[0.2em] uppercase shrink-0">CONCLUÍDA</span>}
             <span className={`text-[7px] font-black px-2 py-0.5 tracking-[0.1em] uppercase shrink-0 ${getTypeColor()}`}>{task.type}</span>
             {task.targetReps > 1 && <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest shrink-0 ${showAsCompleted ? 'text-emerald-300 dark:text-emerald-700' : 'text-slate-400 dark:text-slate-500'}`}>PROGRESSO: {dayState.currentReps}/{task.targetReps}</span>}
          </div>
          <div className="flex items-center gap-5 mt-1 opacity-60">
            <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap transition-colors ${showAsCompleted ? 'text-emerald-400 dark:text-emerald-800' : 'text-slate-400 dark:text-slate-500'}`}>
              {task.type === TaskType.TASK ? (task.status === TaskStatus.COMPLETED ? `CONCLUÍDO EM: ${viewDateStr}` : 'FILA DE OPERAÇÃO // FLUTUANTE') : (task.days ? `ROTINA: ${task.days.join(', ')}` : new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR'))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-white dark:bg-slate-950 text-slate-950 dark:text-white font-roboto transition-colors duration-300`}>
      <aside className="w-full md:w-64 bg-slate-950 p-3 md:p-8 flex flex-col shrink-0 border-r border-slate-900 z-10">
        <div className="flex items-center justify-between md:flex-col md:items-start md:gap-3 mb-3 md:mb-16">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-5 h-5 md:w-6 md:h-6 bg-white flex items-center justify-center text-slate-950 font-black text-[10px] md:text-xs">H</div>
            <h1 className="text-[10px] md:text-sm font-roboto font-bold tracking-[0.2em] text-white uppercase">HOME</h1>
          </div>
          <button onClick={toggleTheme} className="md:hidden flex items-center justify-center w-8 h-8 text-slate-400">{theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}</button>
        </div>
        <nav className="flex flex-row md:flex-col gap-1 md:gap-2 flex-1 md:overflow-visible overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('tasks')} className={`flex items-center gap-3 px-3 md:px-5 py-2 md:py-4 font-bold tracking-widest uppercase text-[9px] md:text-[10px] transition-all whitespace-nowrap bg-slate-900 text-white md:border-l-4 border-b-2 md:border-b-0 border-white`}><Icons.List /> TAREFAS</button>
          <div className="hidden md:block mt-12 px-2">
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-6">Métricas Gerais</p>
            <div className="space-y-8">
               <div className="border-l border-slate-800 pl-4">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pendentes</p>
                 <p className="text-3xl font-bold text-white tracking-tighter">{tasks.filter(t => t.status === TaskStatus.TODO).length}</p>
               </div>
               <div className="border-l border-slate-800 pl-4">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Concluídas</p>
                 <p className="text-3xl font-bold text-white tracking-tighter">{tasks.filter(t => t.status === TaskStatus.COMPLETED).length}</p>
               </div>
            </div>
          </div>
        </nav>
        <div className="hidden md:block mt-auto pt-8 border-t border-slate-900">
          <button onClick={toggleTheme} className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-all py-2">{theme === 'light' ? <Icons.Moon /> : <Icons.Sun />} {theme === 'light' ? 'DARK MODE' : 'LIGHT MODE'}</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/20 dark:bg-slate-900/50">
        <header className="px-4 py-4 md:p-8 lg:p-10 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col md:flex-row items-start md:items-end justify-between sticky top-0 z-20 gap-2 md:gap-0 transition-colors">
          <div className="animate-slide-down">
            <h2 className="text-lg md:text-3xl font-roboto font-bold text-slate-950 dark:text-white tracking-tight uppercase leading-none">Gestão de Tarefas</h2>
            <p className="text-slate-400 mt-1 md:mt-2 font-bold text-[8px] md:text-[10px] uppercase tracking-[0.3em]">BASE DE DADOS // {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-3 md:p-6 lg:p-10 gap-4 md:gap-6">
          <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
            <button onClick={() => setSubTab('today')} className={`px-4 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${subTab === 'today' ? 'border-slate-950 dark:border-white text-slate-950 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Hoje</button>
            <button onClick={() => setSubTab('registry')} className={`px-4 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${subTab === 'registry' ? 'border-slate-950 dark:border-white text-slate-950 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Cadastro</button>
          </div>

          <section className="animate-fade-in flex-1 flex flex-col">
            {isLoading ? (
               <div className="flex-1 flex items-center justify-center">
                 <div className="w-8 h-8 border-2 border-slate-950 dark:border-white border-t-transparent animate-spin"></div>
               </div>
            ) : subTab === 'today' ? (
              <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 flex-1 shadow-sm flex flex-col overflow-hidden animate-fade-in">
                <div className="p-3 md:p-6 border-b border-slate-300 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between bg-emerald-50/20 dark:bg-emerald-950/10 gap-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigateDay(-1)} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-black text-[10px]">◄</button>
                      <button onClick={resetToToday} className={`px-3 h-9 md:h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 transition-all font-black text-[9px] tracking-widest uppercase ${viewDateStr === realTodayStr ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white' : 'bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-600 hover:text-slate-950 dark:hover:text-white'}`}>Hoje</button>
                      <button onClick={() => navigateDay(1)} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-black text-[10px]">►</button>
                    </div>
                    <h3 className="text-[9px] md:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.3em] uppercase flex items-center gap-2 whitespace-nowrap"><span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-emerald-500"></span> Operação: {viewDateStr === realTodayStr ? 'HOJE' : selectedViewDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</h3>
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{filteredTasks.length} Registros</span>
                </div>

                <form onSubmit={handleQuickAdd} className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center text-cyan-500"><Icons.Plus /></div>
                  <input 
                    type="text" 
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    placeholder="Adicionar tarefa rápida para flutuar..."
                    className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  />
                  {quickTaskTitle && (
                    <button type="submit" className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest animate-fade-in">ENTER PARA SALVAR</button>
                  )}
                </form>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-300 dark:divide-slate-800">
                  {filteredTasks.length === 0 ? (
                    <div className="p-12 md:p-24 text-center flex flex-col items-center justify-center opacity-40">
                      <div className="w-10 h-10 md:w-16 md:h-16 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 mb-4"><Icons.Check /></div>
                      <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-slate-500">Nenhum registro para este ciclo.</p>
                    </div>
                  ) : (filteredTasks.map(task => <TaskCard key={task.id} task={task} />))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 flex-1 shadow-sm flex flex-col overflow-hidden animate-fade-in">
                <div className="p-3 md:p-6 border-b border-slate-300 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 gap-3">
                  <div className="flex flex-col"><h3 className="text-[9px] md:text-[10px] font-bold text-slate-950 dark:text-slate-100 tracking-[0.3em] uppercase">Histórico Completo</h3><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{tasks.length} Protocolos</span></div>
                  <button onClick={handleOpenNewTask} className="flex items-center justify-center gap-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4 py-2.5 md:px-6 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95 shadow-sm"><Icons.Plus /> Novo Registro</button>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-300 dark:divide-slate-800">
                  {tasks.length === 0 ? (
                    <div className="p-12 md:p-24 text-center flex flex-col items-center justify-center opacity-40"><div className="w-10 h-10 md:w-16 md:h-16 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 mb-4"><Icons.List /></div><p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-slate-500">Nenhum registro localizado.</p></div>
                  ) : (tasks.map(task => <TaskCard key={task.id} task={task} />))}
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="p-4 md:p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
          <p className="text-[7px] md:text-[8px] font-bold text-slate-200 dark:text-slate-800 uppercase tracking-[0.2em]">HOME // Protocol v2.5</p>
        </footer>
      </main>

      {/* Menu de Contexto */}
      {contextMenu && (
        <div 
          className="fixed z-[200] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl py-2 min-w-[160px] animate-fade-in"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => { handleOpenEditTask(contextMenu.task); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <div className="text-slate-400"><Icons.Edit /></div> EDITAR
          </button>
          <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
          <button 
            onClick={() => { setTaskToDelete(contextMenu.task); setIsDeleteModalOpen(true); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <div className="text-red-400"><Icons.Trash /></div> APAGAR
          </button>
        </div>
      )}

      {/* Modais */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6 animate-fade-in overflow-y-auto bg-slate-950/25 dark:bg-black/60 backdrop-blur-[6px]">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)}></div>
          <section className="relative w-full max-w-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl font-roboto overflow-hidden">
            <div className="bg-slate-950 dark:bg-slate-900 text-white p-5 md:p-6 flex items-center justify-between">
              <div><h3 className="text-[10px] font-bold uppercase tracking-[0.4em] leading-none">{editingTaskId ? 'Editar Registro' : 'Novo Registro de Fluxo'}</h3><p className="text-[7px] opacity-40 font-bold uppercase mt-1 tracking-widest">Protocolo de Configuração v2.5</p></div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-white/10 transition-colors opacity-60 hover:opacity-100">×</button>
            </div>
            <form onSubmit={handleSubmitTask} className="p-5 md:p-8 space-y-8 md:space-y-10 overflow-y-auto max-h-[85vh] scrollbar-hide">
              <div className="space-y-3 md:space-y-4">
                <SectionLabel number="01" text="Definição e Identidade" />
                <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Nome da operação..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 md:p-5 text-base md:text-lg font-bold text-slate-950 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-200 dark:placeholder:text-slate-700" />
              </div>
              <div className="space-y-4 md:space-y-5">
                <SectionLabel number="02" text="Tipo de Registro" />
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setTaskType(TaskType.HABIT)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${taskType === TaskType.HABIT ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}>HÁBITO</button>
                  <button type="button" onClick={() => setTaskType(TaskType.DAILY)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${taskType === TaskType.DAILY ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}>COTIDIANO</button>
                </div>
              </div>
              {taskType !== TaskType.TASK && (
                <>
                  <div className="space-y-4 md:space-y-5">
                    <SectionLabel number="03" text="Ciclo e Volume Operacional" />
                    <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 md:p-6 space-y-6">
                      <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">{DAYS_OF_WEEK.map(day => (<button key={day} type="button" onClick={() => toggleDay(day)} className={`flex-1 min-w-[36px] py-3 text-[9px] font-bold border transition-all ${selectedDays.includes(day) ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}>{day[0]}</button>))}</div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800"><span className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest whitespace-nowrap">Meta de Cliques:</span><input type="number" min="1" value={targetReps || ''} onChange={(e) => setTargetReps(e.target.value === '' ? 0 : parseInt(e.target.value))} className="w-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-2 text-center text-xs font-bold text-slate-950 dark:text-white outline-none focus:border-slate-950 dark:focus:border-white" /></div>
                    </div>
                  </div>
                  <div className="space-y-4 md:space-y-5 pb-6">
                    <SectionLabel number="04" text="Início da Operação" />
                    <button type="button" onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 md:p-5 group hover:bg-white dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all shadow-sm"><div className="flex items-center gap-3 md:gap-4"><div className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 group-hover:border-slate-400 dark:group-hover:border-slate-600"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" className="text-slate-950 dark:text-white"><rect x="3" y="4" width="18" height="18" rx="0" ry="0"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><span className="text-[9px] md:text-[10px] font-bold text-slate-950 dark:text-white uppercase tracking-widest">{new Date(dueDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</span></div><span className={`text-[10px] transition-transform duration-300 ${isCalendarOpen ? 'rotate-180' : ''}`}>▼</span></button>
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isCalendarOpen ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 md:p-6 shadow-sm"><div className="flex items-center justify-between mb-4 md:mb-6 border-b border-slate-100 dark:border-slate-800 pb-4"><button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-950 dark:text-white font-black">◄</button><h4 className="text-[9px] md:text-[10px] font-black tracking-[0.4em] text-slate-950 dark:text-white">{viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</h4><button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-950 dark:text-white font-black">►</button></div><div className="grid grid-cols-7 gap-1 text-center">{DAYS_OF_WEEK.map(d => (<span key={d} className="text-[6px] font-black text-slate-400 uppercase mb-3">{d[0]}</span>))}{calendarDays.map((day, idx) => { if (!day) return <div key={`empty-${idx}`} className="aspect-square" />; const selectable = isDaySelectable(day); const isSelected = formatLocalDate(day) === dueDate; return (<button key={day.toISOString()} type="button" disabled={!selectable} onClick={() => { setDueDate(formatLocalDate(day)); setIsCalendarOpen(false); }} className={`aspect-square flex items-center justify-center text-[10px] font-bold transition-all relative ${isSelected ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-lg z-10' : selectable ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200' : 'text-slate-100 dark:text-slate-900 cursor-not-allowed opacity-10'}`}>{day.getDate()}{selectedDays.includes(DAYS_OF_WEEK[day.getDay()]) && !isSelected && selectable && <div className="absolute bottom-1.5 w-1 h-1 bg-slate-950 dark:bg-white rounded-full"></div>}</button>); })}</div></div>
                    </div>
                  </div>
                </>
              )}
              <div className="pt-6 md:pt-8 border-t border-slate-100 dark:border-slate-800"><button type="submit" disabled={!isFormValid} className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-4 md:py-6 font-black text-[10px] md:text-[11px] uppercase tracking-[0.4em] hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-[0.98] shadow-xl disabled:opacity-30 disabled:cursor-not-allowed">{editingTaskId ? 'ATUALIZAR' : 'CADASTRAR'}</button></div>
            </form>
          </section>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 animate-fade-in bg-slate-950/40 dark:bg-black/80 backdrop-blur-[4px]">
          <div className="absolute inset-0" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative w-full max-w-[400px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 animate-slide-up">
            <div className="mb-6">
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-red-600 leading-tight">Confirmar Exclusão?</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Esta ação não poderá ser desfeita no sistema.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDeleteTask} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all active:scale-[0.98]">Sim, Cancelar Registro</button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-950 dark:text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]">Não, Manter Protocolo</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-down { animation: slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
