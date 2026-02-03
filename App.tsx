
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, TaskStatus } from './types';
import { Icons, CATEGORIES, DAYS_OF_WEEK, TASK_COLORS } from './constants';

type Tab = 'today' | 'tasks';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isStylePickerOpen, setIsStylePickerOpen] = useState(false);

  // Estados para o formulário de cadastro
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [targetReps, setTargetReps] = useState<number>(1);
  const [selectedIcon, setSelectedIcon] = useState('List');
  const [selectedIconColor, setSelectedIconColor] = useState(TASK_COLORS[0]);

  // Estados do Calendário Customizado
  const [viewDate, setViewDate] = useState(new Date());

  // Carregar Dados
  useEffect(() => {
    const savedTasks = localStorage.getItem('zenflow_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
  }, []);

  // Salvar Dados
  useEffect(() => {
    localStorage.setItem('zenflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayDayName = useMemo(() => {
    const d = new Date();
    return DAYS_OF_WEEK[d.getDay()];
  }, []);

  const filteredTasks = useMemo(() => {
    if (activeTab === 'today') {
      return tasks.filter(t => {
        if (t.dueDate === todayStr) return true;
        if (t.days && t.days.includes(todayDayName)) return true;
        return false;
      });
    }
    return tasks;
  }, [tasks, activeTab, todayStr, todayDayName]);

  const isFormValid = useMemo(() => {
    return title.trim() !== '' && targetReps > 0;
  }, [title, targetReps]);

  const handleRegisterTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: title,
      description: '',
      priority: Priority.MEDIUM, 
      status: TaskStatus.TODO,
      category: CATEGORIES[0].name, 
      dueDate,
      days: selectedDays.length > 0 ? selectedDays : undefined,
      createdAt: new Date().toISOString(),
      icon: selectedIcon,
      iconColor: selectedIconColor,
      targetReps: Math.max(1, targetReps),
      currentReps: 0
    };

    setTasks(prev => [newTask, ...prev]);
    setTitle('');
    setDueDate(todayStr);
    setSelectedDays([]);
    setTargetReps(1);
    setSelectedIcon('List');
    setSelectedIconColor(TASK_COLORS[0]);
    setIsModalOpen(false);
    setIsCalendarOpen(false);
    setIsStylePickerOpen(false);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (t.targetReps > 1) {
          const nextReps = t.currentReps + 1;
          const isFinished = nextReps >= t.targetReps;
          return { 
            ...t, 
            currentReps: isFinished ? t.targetReps : nextReps,
            status: isFinished ? TaskStatus.COMPLETED : TaskStatus.TODO
          };
        } else {
          const nextStatus = t.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
          return { ...t, status: nextStatus, currentReps: nextStatus === TaskStatus.COMPLETED ? 1 : 0 };
        }
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    if (confirm("CONFIRMAR EXCLUSÃO PERMANENTE?")) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewDate]);

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const isDaySelectable = (date: Date) => {
    if (selectedDays.length === 0) return true;
    const dayName = DAYS_OF_WEEK[date.getDay()];
    return selectedDays.includes(dayName);
  };

  const TaskIcon = ({ name, color, className }: { name: string, color: string, className?: string }) => {
    const IconComponent = (Icons as any)[name] || Icons.List;
    return <div style={{ color }} className={className}><IconComponent /></div>;
  };

  const SectionLabel = ({ number, text }: { number: string, text: string }) => (
    <label className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em] flex items-center gap-3">
      <span className="w-1.5 h-1.5 bg-slate-950"></span> {number}. {text}
    </label>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-slate-950 font-roboto">
      <aside className="w-full md:w-64 bg-slate-950 p-6 md:p-8 flex flex-col shrink-0 border-r border-slate-900 z-10">
        <div className="flex items-center gap-3 mb-8 md:mb-16">
          <div className="w-6 h-6 bg-white flex items-center justify-center text-slate-950 font-bold text-xs">Z</div>
          <h1 className="text-sm font-roboto font-bold tracking-[0.2em] text-white uppercase">ZenFlow</h1>
        </div>

        <nav className="flex flex-row md:flex-col gap-1 md:gap-2 flex-1 md:overflow-visible overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 font-bold tracking-widest uppercase text-[9px] md:text-[10px] transition-all whitespace-nowrap ${activeTab === 'today' ? 'bg-slate-900 text-white md:border-l-4 border-b-4 md:border-b-0 border-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className="w-4 h-4 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="0" ry="0"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            HOJE
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 font-bold tracking-widest uppercase text-[9px] md:text-[10px] transition-all whitespace-nowrap ${activeTab === 'tasks' ? 'bg-slate-900 text-white md:border-l-4 border-b-4 md:border-b-0 border-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Icons.List />
            TAREFAS
          </button>
          
          <div className="hidden md:block mt-12 px-2">
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-6">Métricas Gerais</p>
            <div className="space-y-8">
               <div className="border-l border-slate-800 pl-4">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pendentes</p>
                 <p className="text-3xl font-bold text-white tracking-tighter">{tasks.length - tasks.filter(t => t.status === TaskStatus.COMPLETED).length}</p>
               </div>
               <div className="border-l border-slate-800 pl-4">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Concluídas</p>
                 <p className="text-3xl font-bold text-white tracking-tighter">{tasks.filter(t => t.status === TaskStatus.COMPLETED).length}</p>
               </div>
            </div>
          </div>
        </nav>

        <div className="hidden md:block mt-auto pt-8 border-t border-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500"></div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sistema Operacional</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/20">
        <header className="p-6 md:p-8 lg:p-10 border-b border-slate-100 bg-white flex flex-col md:flex-row items-start md:items-end justify-between sticky top-0 z-20 gap-4 md:gap-0">
          <div className="animate-slide-down">
            <h2 className="text-2xl md:text-3xl font-roboto font-bold text-slate-950 tracking-tight uppercase leading-none">
              {activeTab === 'today' ? 'Agenda de Hoje' : 'Gestão de Tarefas'}
            </h2>
            <p className="text-slate-400 mt-2 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.3em]">
              BASE DE DADOS LINEAR // {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-950 text-white px-6 py-3 md:py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
          >
            <Icons.Plus /> Novo Registro
          </button>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-10">
          <section className="animate-fade-in">
            <div className="bg-white border border-slate-200 min-h-[500px] md:min-h-[600px] shadow-sm flex flex-col">
              <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-[9px] md:text-[10px] font-bold text-slate-950 tracking-[0.3em] uppercase">
                  {activeTab === 'today' ? 'Atividades para este Período' : 'Histórico Completo de Registros'}
                </h3>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  {filteredTasks.length} Registros
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
                {filteredTasks.length === 0 ? (
                  <div className="p-16 md:p-24 text-center flex flex-col items-center justify-center opacity-40">
                    <div className="w-12 h-12 md:w-16 md:h-16 border-2 border-slate-100 flex items-center justify-center text-slate-300 mb-6">
                      <Icons.List />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Nenhum registro localizado.</p>
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="group flex items-start md:items-center gap-4 md:gap-6 p-4 md:p-6 hover:bg-slate-50 transition-all border-l-4 border-transparent hover:border-l-slate-950"
                      style={{ borderLeftColor: task.status !== TaskStatus.COMPLETED ? 'transparent' : '#e2e8f0' }}
                    >
                      <button 
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`w-9 h-9 md:w-10 md:h-10 shrink-0 border-2 flex flex-col items-center justify-center transition-all relative ${task.status === TaskStatus.COMPLETED ? 'bg-slate-950 border-slate-950 text-white' : 'border-slate-100 bg-white hover:border-slate-950'}`}
                      >
                        {task.targetReps > 1 && task.status !== TaskStatus.COMPLETED ? (
                           <div className="flex flex-col items-center">
                             <span className="text-[9px] md:text-[10px] font-bold">{task.currentReps}</span>
                             <div className="w-3 h-[1px] bg-slate-100 mb-0.5 opacity-30"></div>
                             <span className="text-[7px] md:text-[8px] opacity-50">{task.targetReps}</span>
                           </div>
                        ) : (
                          task.status === TaskStatus.COMPLETED ? <Icons.Check /> : <Icons.Plus />
                        )}
                        {task.targetReps > 1 && task.status !== TaskStatus.COMPLETED && (
                          <div 
                            className="absolute inset-0 border-2 border-slate-950 opacity-10 transition-all" 
                            style={{ clipPath: `inset(${100 - (task.currentReps / task.targetReps) * 100}% 0 0 0)` }}
                          />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <div className="hidden md:flex w-10 h-10 items-center justify-center bg-slate-50 shrink-0">
                           <TaskIcon name={task.icon} color={task.iconColor} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 md:gap-3">
                             <h4 className={`text-sm font-bold tracking-tight truncate ${task.status === TaskStatus.COMPLETED ? 'line-through text-slate-200' : 'text-slate-950'}`}>
                               {task.title}
                             </h4>
                             {task.targetReps > 1 && (
                               <span className="text-[8px] md:text-[9px] font-bold text-slate-300 uppercase tracking-widest shrink-0">
                                 [{task.currentReps}/{task.targetReps}]
                               </span>
                             )}
                          </div>
                          <div className="flex items-center gap-5 mt-0.5 md:mt-1">
                            <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                              {task.days ? `ROTINA: ${task.days.join(', ')}` : new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-slate-100 hover:text-red-600 transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        <footer className="p-6 md:p-8 border-t border-slate-100 bg-white">
          <p className="text-[8px] font-bold text-slate-200 uppercase tracking-[0.2em]">ZenFlow // Protocol v2.5</p>
        </footer>
      </main>

      {/* Modal Responsivo e Unificado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6 animate-fade-in overflow-y-auto bg-slate-950/25 backdrop-blur-[6px]">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)}></div>
          
          <section className="relative w-full max-w-xl bg-white border border-slate-200 shadow-2xl font-roboto overflow-hidden">
            {/* Header */}
            <div className="bg-slate-950 text-white p-5 md:p-6 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] md:tracking-[0.5em] leading-none">Novo Registro de Fluxo</h3>
                <p className="text-[7px] opacity-40 font-bold uppercase mt-1 tracking-widest">Protocolo de Configuração v2.5</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-white/10 transition-colors opacity-60 hover:opacity-100"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleRegisterTask} className="p-5 md:p-8 space-y-8 md:space-y-10 overflow-y-auto max-h-[85vh] scrollbar-hide">
              
              {/* 1. Atividade e Estilo Unificados */}
              <div className="space-y-3 md:space-y-4">
                <SectionLabel number="01" text="Definição e Identidade" />
                <div className="flex gap-2">
                  <input 
                    autoFocus 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    required 
                    placeholder="EX: Meditação, Estudo, Treino..." 
                    className="flex-1 bg-slate-50 border border-slate-100 p-4 md:p-5 text-base md:text-lg font-bold text-slate-950 outline-none focus:border-slate-400 focus:bg-white transition-all placeholder:text-slate-200" 
                  />
                  <button 
                    type="button"
                    onClick={() => setIsStylePickerOpen(!isStylePickerOpen)}
                    className={`w-14 md:w-16 flex items-center justify-center transition-all border shrink-0 ${isStylePickerOpen ? 'bg-slate-950 border-slate-950 shadow-inner' : 'bg-slate-50 border-slate-100 hover:border-slate-400 hover:bg-white'}`}
                  >
                    <TaskIcon 
                      name={selectedIcon} 
                      color={selectedIconColor} 
                      className="scale-125"
                    />
                  </button>
                </div>

                {/* Picker Expansível de Ícones e Cores */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isStylePickerOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                  <div className="bg-slate-50 p-4 md:p-6 border border-slate-100 space-y-6 md:space-y-8 animate-slide-down">
                    <div className="flex items-center justify-between">
                       <h5 className="text-[8px] font-black uppercase tracking-widest text-slate-400">Seletor de Identidade Visual</h5>
                       <button type="button" onClick={() => setIsStylePickerOpen(false)} className="text-[8px] font-black uppercase text-slate-900">Fechar [×]</button>
                    </div>
                    {/* Ícones Grid Adaptativo */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {Object.keys(Icons).filter(k => !['Plus', 'Trash', 'Check', 'List'].includes(k)).concat(['List']).map(iconName => (
                        <button 
                          key={iconName} 
                          type="button" 
                          onClick={() => setSelectedIcon(iconName)}
                          className={`aspect-square flex items-center justify-center transition-all border ${selectedIcon === iconName ? 'bg-white border-slate-950 shadow-sm scale-105 z-10' : 'bg-slate-100/50 border-transparent hover:border-slate-300'}`}
                        >
                          <TaskIcon 
                            name={iconName} 
                            color={selectedIcon === iconName ? selectedIconColor : '#cbd5e1'} 
                          />
                        </button>
                      ))}
                    </div>
                    {/* Paleta Cores Profissional */}
                    <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide border-t border-slate-200/50 pt-5 md:pt-6">
                      {TASK_COLORS.map(color => (
                        <button 
                          key={color} 
                          type="button" 
                          onClick={() => setSelectedIconColor(color)}
                          style={{ backgroundColor: color }}
                          className={`w-5 h-5 md:w-6 md:h-6 shrink-0 transition-all border-2 ${selectedIconColor === color ? 'border-slate-950 ring-2 ring-slate-100 scale-125' : 'border-white opacity-60 hover:opacity-100'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Ciclo Semanal */}
              <div className="space-y-4 md:space-y-5">
                <SectionLabel number="02" text="Ciclo e Volume Operacional" />
                <div className="bg-white border border-slate-100 p-4 md:p-6 space-y-6">
                  <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {DAYS_OF_WEEK.map(day => (
                      <button 
                        key={day} 
                        type="button" 
                        onClick={() => toggleDay(day)} 
                        className={`flex-1 min-w-[36px] py-3 text-[9px] font-bold border transition-all ${selectedDays.includes(day) ? 'bg-slate-950 text-white border-slate-950' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}
                      >
                        {day[0]}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 p-4 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest whitespace-nowrap">Meta de Cliques:</span>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="1" 
                        value={targetReps || ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setTargetReps(val === '' ? 0 : parseInt(val));
                        }} 
                        className="w-16 bg-white border border-slate-200 p-2 text-center text-xs font-bold text-slate-950 outline-none focus:border-slate-950"
                      />
                      <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tight leading-none">Protocolo de <br className="hidden sm:block"/>conclusão diária</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Início da Atividade - Calendário Colapsável */}
              <div className="space-y-4 md:space-y-5 pb-6">
                <SectionLabel number="03" text="Início da Operação" />
                
                <div className="space-y-3">
                  <button 
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="w-full flex items-center justify-between bg-slate-50 border border-slate-100 p-4 md:p-5 group hover:bg-white hover:border-slate-400 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 group-hover:border-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><rect x="3" y="4" width="18" height="18" rx="0" ry="0"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-950 uppercase tracking-widest">
                        {new Date(dueDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                      </span>
                    </div>
                    <span className={`text-[10px] text-slate-950 transition-transform duration-300 ${isCalendarOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isCalendarOpen ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4 md:mb-6 border-b border-slate-100 pb-4">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 transition-colors text-slate-950 font-black">◄</button>
                        <h4 className="text-[9px] md:text-[10px] font-black tracking-[0.4em] text-slate-950">{viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</h4>
                        <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 transition-colors text-slate-950 font-black">►</button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {DAYS_OF_WEEK.map(d => (
                          <span key={d} className="text-[6px] font-black text-slate-400 uppercase mb-3">{d[0]}</span>
                        ))}
                        {calendarDays.map((day, idx) => {
                          if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
                          const selectable = isDaySelectable(day);
                          const isSelected = day.toISOString().split('T')[0] === dueDate;
                          return (
                            <button
                              key={day.toISOString()}
                              type="button"
                              disabled={!selectable}
                              onClick={() => {
                                setDueDate(day.toISOString().split('T')[0]);
                                setIsCalendarOpen(false);
                              }}
                              className={`aspect-square flex items-center justify-center text-[10px] font-bold transition-all relative
                                ${isSelected ? 'bg-slate-950 text-white shadow-lg z-10' : selectable ? 'hover:bg-slate-100 text-slate-800' : 'text-slate-100 cursor-not-allowed opacity-10'}
                              `}
                            >
                              {day.getDate()}
                              {selectedDays.includes(DAYS_OF_WEEK[day.getDay()]) && !isSelected && selectable && <div className="absolute bottom-1.5 w-1 h-1 bg-slate-950 rounded-full"></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Finalização Adaptativo */}
              <div className="pt-6 md:pt-8 border-t border-slate-100 flex flex-col gap-4 md:gap-5">
                <div className="flex items-center justify-between text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-900">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500"></span> Protocolo Validado</span>
                  <span className="text-slate-400">{selectedDays.length > 0 ? `${selectedDays.length} Ciclos` : 'Individual'}</span>
                </div>
                <button 
                  type="submit" 
                  disabled={!isFormValid}
                  className="w-full bg-slate-950 text-white py-4 md:py-6 font-black text-[10px] md:text-[11px] uppercase tracking-[0.4em] md:tracking-[0.6em] hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-950 disabled:active:scale-100"
                >
                  CADASTRAR
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-down { animation: slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
