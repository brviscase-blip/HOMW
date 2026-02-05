
import React, { useState, useEffect } from 'react';
import { Area, Demand, DemandPriority, DemandStatus } from './types';
import { Icons } from './constants';
import { supabase } from './supabaseClient';

interface Props {
  showDebugToggle: boolean;
  onToggleDebug: () => void;
}

const DemandasManager: React.FC<Props> = ({ showDebugToggle, onToggleDebug }) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewAreaModalOpen, setIsNewAreaModalOpen] = useState(false);
  const [isNewDemandModalOpen, setIsNewDemandModalOpen] = useState(false);
  
  // Debug State
  const [logs, setLogs] = useState<string[]>([]);
  const [lastRawError, setLastRawError] = useState<any>(null);

  const [newAreaName, setNewAreaName] = useState('');
  const [demandForm, setDemandForm] = useState({
    title: '',
    priority: 'MEDIA' as DemandPriority,
    due_date: ''
  });

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
  };

  const fetchAreas = async () => {
    setIsLoading(true);
    addLog("Iniciando busca de áreas...");
    try {
      const { data, error } = await supabase.from('areas').select('*').order('name');
      if (error) throw error;
      setAreas(data || []);
      addLog(`Sucesso: ${data?.length || 0} áreas localizadas.`);
    } catch (err: any) {
      addLog(`ERRO ÁREAS: ${err.message}`);
      setLastRawError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDemands = async (areaId: string) => {
    addLog(`Buscando demandas para área: ${areaId}`);
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .eq('area_id', areaId)
        .order('created_at', { ascending: false });

      if (error) {
        addLog(`ERRO LISTAGEM: ${error.code} - ${error.message}`);
        setLastRawError(error);
        throw error;
      }
      setDemands(data || []);
      addLog(`Sucesso: ${data?.length || 0} demandas carregadas.`);
    } catch (err: any) {
      console.error('Erro ao buscar demandas:', err);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      fetchDemands(selectedArea.id);
    }
  }, [selectedArea]);

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    addLog(`Criando área: ${newAreaName}`);
    try {
      const { data, error } = await supabase.from('areas').insert([{ name: newAreaName }]).select();
      if (error) throw error;
      if (data) {
        setAreas(prev => [...prev, data[0]]);
        setNewAreaName('');
        setIsNewAreaModalOpen(false);
        addLog("Área criada com sucesso.");
      }
    } catch (err: any) {
      addLog(`ERRO CRIAÇÃO ÁREA: ${err.message}`);
      setLastRawError(err);
    }
  };

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandForm.title.trim() || !selectedArea) return;

    addLog(`Tentando criar demanda: "${demandForm.title}"`);
    
    const payload: any = { 
      area_id: selectedArea.id, 
      title: demandForm.title.trim(),
      description: '', 
      priority: demandForm.priority || 'MEDIA',
      status: 'A FAZER'
    };

    if (demandForm.due_date) payload.due_date = demandForm.due_date;

    try {
      const { data, error } = await supabase.from('demands').insert([payload]).select();

      if (error) {
        addLog(`FALHA NO SERVIDOR: ${error.code} - ${error.message}`);
        setLastRawError(error);
      } else if (data) {
        addLog("Demanda criada com sucesso!");
        setDemands(prev => [data[0], ...prev]);
        setDemandForm({ title: '', priority: 'MEDIA', due_date: '' });
        setIsNewDemandModalOpen(false);
      }
    } catch (err: any) {
      addLog(`EXCEÇÃO JS: ${err.message}`);
    }
  };

  const updateDemandStatus = async (id: string, newStatus: DemandStatus) => {
    const updateData: any = { status: newStatus };
    if (newStatus === 'CONCLUIDO') updateData.completed_at = new Date().toISOString();
    
    addLog(`Atualizando status demanda ${id} para ${newStatus}`);
    const { data, error } = await supabase.from('demands').update(updateData).eq('id', id).select();
    
    if (error) {
      addLog(`ERRO UPDATE: ${error.message}`);
      setLastRawError(error);
    } else if (data) {
      setDemands(prev => prev.map(d => d.id === id ? data[0] : d));
      addLog("Status atualizado.");
    }
  };

  const getStatusStyles = (s: DemandStatus) => {
    switch (s) {
      case 'A FAZER': return 'bg-slate-50 text-slate-400 border-slate-200';
      case 'EM APROVACAO': return 'bg-indigo-50 text-indigo-500 border-indigo-200';
      case 'EM EXECUCAO': return 'bg-cyan-50 text-cyan-500 border-cyan-200';
      case 'CONCLUIDO': return 'bg-emerald-50 text-emerald-500 border-emerald-200';
    }
  };

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent animate-spin"></div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col space-y-4 animate-fade-in relative pb-10">
      {!selectedArea ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setIsNewAreaModalOpen(true)}
            className="aspect-video bg-white dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 hover:border-slate-400 transition-all group"
          >
            <div className="text-slate-300 group-hover:text-slate-900 transition-colors"><Icons.Plus /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Criar Nova Área</span>
          </button>
          {areas.map(area => (
            <div 
              key={area.id} onClick={() => setSelectedArea(area)}
              className="aspect-video bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"><Icons.Folder /></div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white truncate">{area.name}</h3>
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">SISTEMA ATIVO</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between">
            <button onClick={() => setSelectedArea(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-950 transition-all">
              <Icons.ChevronLeft /> VOLTAR
            </button>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsNewDemandModalOpen(true)} className="bg-slate-950 text-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg">+ NOVA DEMANDA</button>
              <div className="text-right border-l border-slate-200 pl-4">
                <h3 className="text-lg font-black uppercase leading-none tracking-tight">{selectedArea.name}</h3>
                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Sincronizado // {demands.length} Demandas</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 w-20">ID</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">TÍTULO</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 w-32 text-center">PRIORIDADE</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 w-44">STATUS OPERACIONAL</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 w-32">PRAZO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {demands.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-slate-300">Aguardando inserção de dados.</td></tr>
                  ) : (
                    demands.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-2.5 text-[10px] font-black text-slate-300 font-mono">#{String(d.display_id || '0').padStart(3, '0')}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[11px] font-bold block truncate max-w-md ${d.status === 'CONCLUIDO' ? 'line-through opacity-40' : 'text-slate-950 dark:text-white'}`}>{d.title}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-block text-[8px] font-black px-2 py-0.5 tracking-widest border border-slate-200 uppercase`}>{d.priority || 'MEDIA'}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <select 
                            value={d.status || 'A FAZER'} onChange={(e) => updateDemandStatus(d.id, e.target.value as DemandStatus)}
                            className={`text-[9px] font-black px-2 py-1.5 uppercase tracking-widest outline-none border cursor-pointer w-full ${getStatusStyles(d.status || 'A FAZER')}`}
                          >
                            <option value="A FAZER">A FAZER</option>
                            <option value="EM APROVACAO">APROVAÇÃO</option>
                            <option value="EM EXECUCAO">EXECUÇÃO</option>
                            <option value="CONCLUIDO">CONCLUÍDO</option>
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.due_date || '---'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DEBUG CONSOLE FOOTER - Oculto por padrão */}
      {showDebugToggle && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-black text-[#00ff41] font-mono text-[9px] p-2 border-t border-[#00ff41]/20 z-[90] max-h-40 overflow-y-auto shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between border-b border-[#00ff41]/20 pb-1 mb-1">
            <span className="font-black animate-pulse">>>> SUPABASE_DEBUG_INTERFACE // STATUS: {lastRawError ? 'FAIL' : 'READY'}</span>
            <div className="flex gap-2">
               <button onClick={() => setLogs([])} className="text-white/50 hover:text-white px-2 border border-white/20">CLS</button>
               <button onClick={onToggleDebug} className="text-white/50 hover:text-white px-2 border border-white/20">HIDE</button>
            </div>
          </div>
          {logs.map((log, i) => <div key={i} className="leading-tight select-all">{log}</div>)}
          {lastRawError && (
            <div className="text-red-400 mt-2 p-2 bg-red-950/40 border border-red-900 select-all">
              CRITICAL_ERROR_DUMP: {JSON.stringify(lastRawError)}
            </div>
          )}
        </div>
      )}

      {/* Modais */}
      {isNewAreaModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => setIsNewAreaModalOpen(false)}></div>
          <form onSubmit={handleCreateArea} className="relative w-full max-w-xs bg-white dark:bg-slate-950 p-6 space-y-5 border border-slate-200">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Nova Área de Gestão</h3>
            <input autoFocus value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} placeholder="Ex: Tecnologia, Financeiro..." className="w-full bg-slate-50 border border-slate-100 p-3 text-xs font-bold outline-none text-center" />
            <button type="submit" disabled={!newAreaName.trim()} className="w-full py-4 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30">Confirmar Registro</button>
          </form>
        </div>
      )}

      {isNewDemandModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => setIsNewDemandModalOpen(false)}></div>
          <form onSubmit={handleCreateDemand} className="relative w-full max-w-sm bg-white dark:bg-slate-950 p-6 md:p-8 space-y-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em]">Registrar Demanda</h3>
              <button type="button" onClick={() => setIsNewDemandModalOpen(false)} className="text-xl opacity-40 hover:opacity-100">×</button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Título da Solicitação</label>
                <input autoFocus value={demandForm.title} onChange={(e) => setDemandForm({...demandForm, title: e.target.value})} placeholder="Descreva a tarefa..." className="w-full bg-slate-50 border border-slate-100 p-3.5 text-xs font-bold outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Prioridade</label>
                  <select value={demandForm.priority} onChange={(e) => setDemandForm({...demandForm, priority: e.target.value as DemandPriority})} className="w-full bg-slate-50 border border-slate-100 p-3 text-xs font-bold outline-none cursor-pointer">
                    <option value="BAIXA">BAIXA</option>
                    <option value="MEDIA">MÉDIA</option>
                    <option value="ALTA">ALTA</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Prazo Final</label>
                  <input type="date" value={demandForm.due_date} onChange={(e) => setDemandForm({...demandForm, due_date: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-3 text-xs font-bold outline-none" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={!demandForm.title.trim()} className="w-full py-4 bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-lg disabled:opacity-30">Confirmar Registro</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DemandasManager;
