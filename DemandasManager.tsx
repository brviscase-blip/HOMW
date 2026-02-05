
import React, { useState, useEffect } from 'react';
import { Area, Demand } from './types';
import { Icons } from './constants';
import { supabase } from './supabaseClient';

const DemandasManager: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewAreaModalOpen, setIsNewAreaModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newDemandDescription, setNewDemandDescription] = useState('');

  const fetchAreas = async () => {
    setIsLoading(true);
    // Busca áreas e conta demandas pendentes (simulado via query separada para simplicidade)
    const { data: areasData, error: areasError } = await supabase
      .from('areas')
      .select('*')
      .order('name');

    if (areasError) {
      console.error('Erro ao buscar áreas:', areasError);
    } else {
      setAreas(areasData);
    }
    setIsLoading(false);
  };

  const fetchDemands = async (areaId: string) => {
    const { data, error } = await supabase
      .from('demands')
      .select('*')
      .eq('area_id', areaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar demandas:', error);
    } else {
      setDemands(data);
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

    const { data, error } = await supabase
      .from('areas')
      .insert([{ name: newAreaName }])
      .select();

    if (error) {
      console.error('Erro ao criar área:', error);
    } else if (data) {
      setAreas(prev => [...prev, data[0]]);
      setNewAreaName('');
      setIsNewAreaModalOpen(false);
    }
  };

  const handleDeleteArea = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir esta área e todas as suas demandas?')) return;

    const { error } = await supabase.from('areas').delete().eq('id', id);
    if (!error) {
      setAreas(prev => prev.filter(a => a.id !== id));
      if (selectedArea?.id === id) setSelectedArea(null);
    }
  };

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDemandDescription.trim() || !selectedArea) return;

    const { data, error } = await supabase
      .from('demands')
      .insert([{ area_id: selectedArea.id, description: newDemandDescription, status: 'PENDENTE' }])
      .select();

    if (error) {
      console.error('Erro ao criar demanda:', error);
    } else if (data) {
      setDemands(prev => [data[0], ...prev]);
      setNewDemandDescription('');
    }
  };

  const toggleDemandStatus = async (demand: Demand) => {
    const newStatus = demand.status === 'PENDENTE' ? 'CONCLUIDA' : 'PENDENTE';
    const { data, error } = await supabase
      .from('demands')
      .update({ status: newStatus })
      .eq('id', demand.id)
      .select();

    if (!error && data) {
      setDemands(prev => prev.map(d => d.id === demand.id ? data[0] : d));
    }
  };

  const handleDeleteDemand = async (id: string) => {
    const { error } = await supabase.from('demands').delete().eq('id', id);
    if (!error) {
      setDemands(prev => prev.filter(d => d.id !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-950 dark:border-white border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      {!selectedArea ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Card de Adicionar Área */}
            <button 
              onClick={() => setIsNewAreaModalOpen(true)}
              className="aspect-video bg-white dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 hover:border-slate-400 dark:hover:border-slate-600 transition-all group"
            >
              <div className="w-12 h-12 flex items-center justify-center text-slate-300 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                <Icons.Plus />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-950 dark:group-hover:text-white">Criar Nova Área</span>
            </button>

            {/* Lista de Áreas */}
            {areas.map(area => (
              <div 
                key={area.id}
                onClick={() => setSelectedArea(area)}
                className="aspect-video bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white">
                    <Icons.Folder />
                  </div>
                  <button 
                    onClick={(e) => handleDeleteArea(area.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all"
                  >
                    <Icons.Trash />
                  </button>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-950 dark:text-white truncate">
                    {area.name}
                  </h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Base de Gestão Ativa
                  </p>
                </div>
                {/* Detalhe estético: Barra de rodapé */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-900 group-hover:bg-slate-950 dark:group-hover:bg-white transition-colors"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-6">
          {/* Header da Área Selecionada */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedArea(null)}
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all"
            >
              <Icons.ChevronLeft /> Voltar ao Dashboard
            </button>
            <div className="text-right">
              <h3 className="text-xl font-black uppercase tracking-tighter text-slate-950 dark:text-white leading-none">
                {selectedArea.name}
              </h3>
              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Ambiente Controlado // {demands.length} Demandas</span>
            </div>
          </div>

          {/* Área de Criação Direta (Inline) */}
          <form onSubmit={handleCreateDemand} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <input 
              autoFocus
              value={newDemandDescription}
              onChange={(e) => setNewDemandDescription(e.target.value)}
              placeholder="Descreva a nova demanda..."
              className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
            />
            <button 
              type="submit"
              disabled={!newDemandDescription.trim()}
              className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-6 py-2 text-[9px] font-black uppercase tracking-widest disabled:opacity-30"
            >
              Adicionar
            </button>
          </form>

          {/* Tabela de Demandas */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 w-16 text-center">Status</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Descrição</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 w-32">Data</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 w-16">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {demands.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Nenhuma demanda registrada nesta área.</p>
                    </td>
                  </tr>
                ) : (
                  demands.map(demand => (
                    <tr key={demand.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button 
                            onClick={() => toggleDemandStatus(demand)}
                            className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${demand.status === 'CONCLUIDA' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500'}`}
                          >
                            {demand.status === 'CONCLUIDA' && <Icons.Check />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold ${demand.status === 'CONCLUIDA' ? 'line-through text-slate-300 dark:text-slate-700' : 'text-slate-900 dark:text-white'}`}>
                          {demand.description}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(demand.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDeleteDemand(demand.id)}
                          className="text-red-400 hover:text-red-600 transition-all p-1"
                        >
                          <Icons.Trash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nova Área */}
      {isNewAreaModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => setIsNewAreaModalOpen(false)}></div>
          <form 
            onSubmit={handleCreateArea}
            className="relative w-full max-w-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-8 space-y-6"
          >
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-950 dark:text-white">Nova Área de Gestão</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">Defina o nome da sua nova categoria de vida.</p>
            </div>
            <input 
              autoFocus
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              placeholder="Ex: Empresa, Pessoal, Viagens..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-xs font-bold outline-none focus:border-slate-950 dark:focus:border-white transition-all"
            />
            <div className="flex gap-2 pt-4">
              <button 
                type="button"
                onClick={() => setIsNewAreaModalOpen(false)}
                className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-950 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={!newAreaName.trim()}
                className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-30"
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DemandasManager;
