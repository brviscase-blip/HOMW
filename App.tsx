
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, TaskStatus } from './types';
import { Icons, CATEGORIES, DAYS_OF_WEEK, TASK_COLORS } from './constants';

type Tab = 'today' | 'tasks';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);

  // Estados para o formulário de cadastro
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [targetReps, setTargetReps] = useState(1);
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

  const handleRegisterTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: title.toUpperCase(),
      description: '',
      priority: Priority.MEDIUM, 
      status: TaskStatus.TODO,
      category, 
      dueDate,
      days: selectedDays.length > 0 ? selectedDays : undefined,
      createdAt: new Date().toISOString(),
      icon: selectedIcon,
      iconColor: selectedIconColor,
      targetReps: Math.max(1, targetReps),
      currentReps: 0
    };

    setTasks(prev => [newTask, ...prev]);
    // Reset Form
    setTitle('');
    setDueDate(todayStr);
    setSelectedDays([]);
    setTargetReps(1);
    setSelectedIcon('List');
    setSelectedIconColor(TASK_COLORS[0]);
    setIsModalOpen(false);
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

  // Lógica do Calendário Customizado
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-slate-950 font-roboto">
      {/* Sidebar Lateral */}
      <aside className="w-full md:w-64 bg-slate-950 p-8 flex flex-col shrink-0 border-r border-slate-900 z-10">
        <div className="flex items-center gap-3 mb-16">
          <div className="w-6 h-6 bg-white flex items-center justify-center text-slate-950 font-bold text-xs">Z</div>
          <h1 className="text-sm font-roboto font-bold tracking-[0.2em] text-white uppercase">ZenFlow</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <button 
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest uppercase text-[10px] transition-all ${activeTab === 'today' ? 'bg-slate-900 text-white border-l-4 border-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="0" ry="0"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            HOJE
          </button>
          
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest uppercase text-[10px] transition-all ${activeTab === 'tasks' ? 'bg-slate-900 text-white border-l-4 border-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Icons.List />
            TAREFAS
          </button>
          
          <div className="mt-12 px-2">
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-6">Métricas Gerais</p>
            <div className="space-y-8">
               <div className="border-l border-slate-800 pl-4">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pendentes</p>
                 <p className="text-3xl font-bold text-white tracking-tighter">{tasks.length - tasks.filter(t => t.status === TaskStatus.COMPLETED).length}</p>
               </div>
               <div className="border-l border-slate-800 pl-4">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Concluídas</p>
                 <p className="text-3xl font-bold text-slate-800 tracking-tighter">{tasks.filter(t => t.status === TaskStatus.COMPLETED).length}</p>
               </div>
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500"></div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sistema Operacional</p>
          </div>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/20">
        <header className="p-8 lg:p-10 border-b border-slate-100 bg-white flex items-end justify-between sticky top-0 z-20">
          <div className="animate-slide-down">
            <h2 className="text-3xl font-roboto font-bold text-slate-950 tracking-tight uppercase leading-none">
              {activeTab === 'today' ? 'Agenda de Hoje' : 'Gestão de Tarefas'}
            </h2>
            <p className="text-slate-400 mt-2 font-bold text-[10px] uppercase tracking-[0.3em]">
              {activeTab === 'today' ? 'Filtro Temporal Ativo' : 'Base de Dados Linear'} // {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-slate-950 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
            >
              <Icons.Plus /> Novo Registro
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-10">
          <section className="animate-fade-in">
            <div className="bg-white border border-slate-100 min-h-[600px] shadow-sm flex flex-col">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <h3 className="text-[10px] font-bold text-slate-950 tracking-[0.3em] uppercase">
                  {activeTab === 'today' ? 'Atividades para este Período' : 'Histórico Completo de Registros'}
                </h3>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  {filteredTasks.length} Localizados
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {filteredTasks.length === 0 ? (
                  <div className="p-24 text-center flex flex-col items-center justify-center opacity-40">
                    <div className="w-16 h-16 border-2 border-slate-100 flex items-center justify-center text-slate-300 mb-6">
                      <Icons.List />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Nenhum registro encontrado.</p>
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div key={task.id} className="group flex items-center gap-6 p-6 hover:bg-slate-50 transition-colors">
                      <button 
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`w-10 h-10 shrink-0 border-2 flex flex-col items-center justify-center transition-all relative ${task.status === TaskStatus.COMPLETED ? 'bg-slate-950 border-slate-950 text-white' : 'border-slate-100 bg-white hover:border-slate-950'}`}
                      >
                        {task.targetReps > 1 && task.status !== TaskStatus.COMPLETED ? (
                           <div className="flex flex-col items-center">
                             <span className="text-[10px] font-bold">{task.currentReps}</span>
                             <div className="w-4 h-[1px] bg-slate-100 mb-0.5 opacity-30"></div>
                             <span className="text-[8px] opacity-50">{task.targetReps}</span>
                           </div>
                        ) : (
                          task.status === TaskStatus.COMPLETED ? <Icons.Check /> : <Icons.Plus />
                        )}
                        {/* Progress Visual */}
                        {task.targetReps > 1 && task.status !== TaskStatus.COMPLETED && (
                          <div 
                            className="absolute inset-0 border-2 border-slate-950 opacity-10 transition-all" 
                            style={{ clipPath: `inset(${100 - (task.currentReps / task.targetReps) * 100}% 0 0 0)` }}
                          />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-50">
                           <TaskIcon name={task.icon} color={task.iconColor} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                             <h4 className={`text-sm font-bold tracking-tight uppercase ${task.status === TaskStatus.COMPLETED ? 'line-through text-slate-200' : 'text-slate-950'}`}>
                               {task.title}
                             </h4>
                             {task.targetReps > 1 && (
                               <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                 [{task.currentReps}/{task.targetReps}]
                               </span>
                             )}
                          </div>
                          <div className="flex items-center gap-5 mt-1">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                              {task.days ? `ROTINA: ${task.days.join(', ')}` : new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-slate-100 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
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

        <footer className="p-8 border-t border-slate-100 bg-white">
          <p className="text-[8px] font-bold text-slate-200 uppercase tracking-[0.2em]">ZenFlow // Protocol v2.5</p>
        </footer>
      </main>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12 animate-fade-in overflow-y-auto">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <section className="relative w-full max-w-5xl bg-white border-2 border-slate-950 p-8 lg:p-12 shadow-[24px_24px_0px_0px_rgba(15,23,42,0.15)] font-roboto">
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-950"></div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-[0.4em]">Cadastro de Atividade</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-2xl font-bold hover:bg-slate-50 transition-colors">×</button>
            </div>
            
            <form onSubmit={handleRegisterTask} className="space-y-12">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">O que será executado?*</label>
                <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="IDENTIFICAÇÃO DA TAREFA..." className="w-full px-0 py-4 bg-transparent border-b-2 border-slate-100 focus:border-slate-950 outline-none transition-all text-2xl font-bold uppercase placeholder:text-slate-100 font-roboto" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Lado 1: Frequência e Repetições */}
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frequência Semanal</label>
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS_OF_WEEK.map(day => (
                        <button key={day} type="button" onClick={() => toggleDay(day)} className={`aspect-square flex items-center justify-center border-2 text-[10px] font-bold transition-all ${selectedDays.includes(day) ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-400 border-slate-50'}`}>
                          {day[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Repetições Diárias</label>
                    <div className="flex items-center gap-4">
                       <input 
                         type="number" 
                         min="1" 
                         value={targetReps} 
                         onChange={(e) => setTargetReps(parseInt(e.target.value) || 1)} 
                         className="w-20 bg-slate-50 border-2 border-slate-50 p-3 text-[12px] font-bold text-slate-950 outline-none focus:border-slate-950"
                       />
                       <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                         Quantas vezes você precisa realizar isso por dia para concluir o ciclo? (Ex: 6 copos d'água)
                       </p>
                    </div>
                  </div>
                </div>

                {/* Lado 2: Ícone e Cor */}
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escolha o Ícone</label>
                    <div className="grid grid-cols-4 gap-2">
                       {Object.keys(Icons).filter(k => !['Plus', 'Trash', 'Check', 'List'].includes(k)).concat(['List']).map(iconName => (
                         <button 
                           key={iconName} 
                           type="button" 
                           onClick={() => setSelectedIcon(iconName)}
                           className={`aspect-square flex items-center justify-center border-2 transition-all ${selectedIcon === iconName ? 'border-slate-950 bg-slate-50' : 'border-slate-50 hover:border-slate-100'}`}
                         >
                           <TaskIcon name={iconName} color={selectedIcon === iconName ? selectedIconColor : '#cbd5e1'} />
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paleta de Cores</label>
                    <div className="grid grid-cols-4 gap-2">
                       {TASK_COLORS.map(color => (
                         <button 
                           key={color} 
                           type="button" 
                           onClick={() => setSelectedIconColor(color)}
                           style={{ backgroundColor: color }}
                           className={`aspect-square border-4 transition-all ${selectedIconColor === color ? 'border-white ring-2 ring-slate-950' : 'border-transparent'}`}
                         />
                       ))}
                    </div>
                  </div>
                </div>

                {/* Lado 3: Data de Início */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Início das Operações</label>
                  <div className="border-2 border-slate-100 p-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <button type="button" onClick={() => changeMonth(-1)} className="p-2">◄</button>
                      <h4 className="text-[9px] font-bold tracking-[0.2em]">{viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</h4>
                      <button type="button" onClick={() => changeMonth(1)} className="p-2">►</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
                        const dayName = DAYS_OF_WEEK[day.getDay()];
                        const selectable = isDaySelectable(day);
                        const isSelected = day.toISOString().split('T')[0] === dueDate;
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            disabled={!selectable}
                            onClick={() => setDueDate(day.toISOString().split('T')[0])}
                            className={`aspect-square flex flex-col items-center justify-center text-[10px] font-bold transition-all relative
                              ${isSelected ? 'bg-slate-950 text-white' : selectable ? 'hover:bg-slate-50 text-slate-800' : 'text-slate-100 cursor-not-allowed opacity-30'}
                            `}
                          >
                            {day.getDate()}
                            {selectedDays.includes(dayName) && !isSelected && selectable && <div className="absolute bottom-1 w-1 h-1 bg-slate-950"></div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 text-[9px] font-bold text-slate-950 uppercase tracking-widest text-center border-2 border-slate-50">
                    Confirmado para: {new Date(dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <button type="submit" className="w-full bg-slate-950 text-white py-6 font-bold text-xs uppercase tracking-[0.5em] hover:bg-slate-800 transition-all active:scale-[0.98]">
                  Sincronizar Protocolo
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
        .animate-slide-down { animation: slide-down 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
