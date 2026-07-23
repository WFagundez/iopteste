import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useApp } from '../context';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { Formulario } from '../types';

export default function FormulariosPage() {
  const { addToast } = useApp();
  const navigate = useNavigate();
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Formulario | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState({ codigo: '', titulo: '', responsavel: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getFormularios();
      setFormularios(data);
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = formularios.filter(f => {
    if (filters.codigo && !f.codigo.toLowerCase().includes(filters.codigo.toLowerCase())) return false;
    if (filters.titulo && !f.titulo.toLowerCase().includes(filters.titulo.toLowerCase())) return false;
    if (filters.responsavel && !(f.responsavel || '').toLowerCase().includes(filters.responsavel.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await api.deleteFormulario(String(selected.id));
      addToast('success', 'Formulário excluído.');
      setSelected(null);
      setShowDeleteModal(false);
      loadData();
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-[14px]">Filtros de busca</span>
          {filtersOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {filtersOpen && (
          <div className="px-4 pb-4 border-t border-[#EEEEEE]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              <div>
                <label className="text-[11px] text-text-secondary mb-1 block">Centro produtivo</label>
                <select className="input-field w-full bg-gray-100" disabled>
                  <option>1010</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-text-secondary mb-1 block">Código</label>
                <input
                  type="text"
                  className="input-field w-full"
                  value={filters.codigo}
                  onChange={e => setFilters(f => ({ ...f, codigo: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[11px] text-text-secondary mb-1 block">Título</label>
                <input
                  type="text"
                  className="input-field w-full"
                  value={filters.titulo}
                  onChange={e => setFilters(f => ({ ...f, titulo: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[11px] text-text-secondary mb-1 block">Responsável</label>
                <input
                  type="text"
                  className="input-field w-full"
                  value={filters.responsavel}
                  onChange={e => setFilters(f => ({ ...f, responsavel: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/formularios/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Criar formulário
          </button>
          <button
            onClick={() => selected && navigate(`/formularios/${selected.id}/edit`)}
            disabled={!selected}
            className={`px-4 py-[7px] rounded-lg text-[13px] font-medium border transition-colors ${
              selected
                ? 'bg-white text-text-primary border-[#CCCCCC] hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
          >
            <Pencil size={14} className="inline mr-1" /> Editar
          </button>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={!selected}
          className={`flex items-center gap-2 px-4 py-[7px] rounded-lg text-[13px] font-medium transition-colors ${
            selected
              ? 'bg-status-red text-white hover:bg-red-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Trash2 size={16} /> Excluir
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header-orange">
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-left px-4 py-3">Título</th>
                <th className="text-left px-4 py-3">Nº de blocos</th>
                <th className="text-left px-4 py-3">Nº de itens</th>
                <th className="text-left px-4 py-3">Responsável</th>
                <th className="text-left px-4 py-3">Últ. Modificação</th>
                <th className="text-left px-4 py-3">Validade</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton w-full h-5" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-secondary">
                    <Search size={48} className="mx-auto mb-3 opacity-40" />
                    <p>Nenhum formulário encontrado.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(form => (
                  <tr
                    key={form.id}
                    onClick={() => setSelected(selected?.id === form.id ? null : form)}
                    className={`border-b border-[#EEEEEE] cursor-pointer transition-colors ${
                      selected?.id === form.id
                        ? 'border-l-4 border-l-primary bg-primary-light/30'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-[12px] font-medium text-blue-accent">{form.codigo}</td>
                    <td className="px-4 py-3 text-[12px]">{form.titulo}</td>
                    <td className="px-4 py-3 text-[12px]">{form.num_blocos}</td>
                    <td className="px-4 py-3 text-[12px]">{form.num_itens}</td>
                    <td className="px-4 py-3 text-[12px]">{form.responsavel || '-'}</td>
                    <td className="px-4 py-3 text-[12px] text-text-secondary">
                      {new Date(form.modificado_em).toLocaleDateString('pt-BR')} — V0
                    </td>
                    <td className="px-4 py-3 text-[12px]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-status-green" />
                        {form.validade}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(4,44,83,0.25)' }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-[16px] font-semibold mb-3">Confirmar exclusão</h2>
            <p className="text-[13px] text-text-secondary mb-4">
              Tem certeza que deseja excluir o formulário <strong>{selected.codigo}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleDelete} className="btn-danger">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
