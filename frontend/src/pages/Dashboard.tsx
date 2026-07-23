import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context';
import { ListChecks, FileText, ClipboardCheck, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import type { DashboardStats, NaoConformidade, DistribuicaoStatus, Inspecao } from '../types';

const statusColors: Record<string, string> = {
  aprovado: '#1D9E75',
  aprovado_ressalvas: '#E8970C',
  reprovado: '#E24B4A',
  nao_aplica: '#0E7C96',
};

const statusLabels: Record<string, string> = {
  aprovado: 'Aprovado',
  aprovado_ressalvas: 'Aprov. c/ ressalvas',
  reprovado: 'Reprovado',
  nao_aplica: 'N/A',
};

const statusBadgeClasses: Record<string, string> = {
  aprovado: 'bg-green-100 text-green-700',
  aprovado_ressalvas: 'bg-yellow-100 text-yellow-700',
  reprovado: 'bg-red-100 text-red-700',
  nao_aplica: 'bg-teal-100 text-teal-700',
};

export default function Dashboard() {
  const { addToast } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [naoConformidades, setNaoConformidades] = useState<NaoConformidade[]>([]);
  const [distribuicao, setDistribuicao] = useState<DistribuicaoStatus[]>([]);
  const [ultimasInspecoes, setUltimasInspecoes] = useState<Inspecao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [s, nc, ds, ui] = await Promise.all([
        api.getDashboardStats(),
        api.getNaoConformidades(),
        api.getDistribuicaoStatus(),
        api.getUltimasInspecoes(),
      ]);
      setStats(s);
      setNaoConformidades(nc);
      setDistribuicao(ds);
      setUltimasInspecoes(ui);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Total de itens', value: stats?.total_items ?? 0, icon: ListChecks, color: 'text-blue-accent' },
    { label: 'Total de formulários', value: stats?.total_formularios ?? 0, icon: FileText, color: 'text-primary' },
    { label: 'Total de inspeções', value: stats?.total_inspecoes ?? 0, icon: ClipboardCheck, color: 'text-status-green' },
    { label: 'Taxa de aprovação %', value: `${stats?.taxa_aprovacao ?? 0}%`, icon: PieIcon, color: 'text-status-teal' },
  ];

  const pieData = distribuicao.map(d => ({
    name: statusLabels[d.status] || d.status,
    value: d.count,
    color: statusColors[d.status] || '#9CA3AF',
  }));

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="card p-4 flex items-center gap-4">
              <div className={`${card.color}`}>
                <Icon size={28} />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {loading ? <div className="skeleton w-16 h-8" /> : card.value}
                </div>
                <div className="text-[12px] text-text-secondary">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart 1: Não conformidades */}
      <div className="card p-5">
        <h3 className="text-[14px] font-semibold text-text-primary mb-4">Itens com mais não conformidades</h3>
        {loading ? (
          <div className="skeleton w-full h-[300px]" />
        ) : naoConformidades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
            <ClipboardCheck size={48} className="mb-3 opacity-40" />
            <p>Nenhuma inspeção registrada ainda.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={naoConformidades.map(nc => ({
                ...nc,
                label: `${nc.item_codigo} — ${nc.item_titulo.substring(0, 40)}${nc.item_titulo.length > 40 ? '...' : ''}`,
              }))}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="label" type="category" width={280} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="reprovado_count" fill="#E24B4A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart 2 + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut chart */}
        <div className="card p-5">
          <h3 className="text-[14px] font-semibold text-text-primary mb-4">Distribuição de status</h3>
          {loading ? (
            <div className="skeleton w-full h-[300px]" />
          ) : pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <PieIcon size={48} className="mb-3 opacity-40" />
              <p>Sem dados de status.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value: string, entry: any) => (
                    <span style={{ fontSize: '12px' }}>{value}: {entry.payload.value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Table */}
        <div className="card p-5">
          <h3 className="text-[14px] font-semibold text-text-primary mb-4">Últimas inspeções</h3>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton w-full h-10" />
              ))}
            </div>
          ) : ultimasInspecoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <ClipboardCheck size={48} className="mb-3 opacity-40" />
              <p>Sem inspeções registradas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#CCCCCC]">
                    <th className="text-left text-[11px] uppercase text-text-secondary font-medium py-2">Formulário</th>
                    <th className="text-left text-[11px] uppercase text-text-secondary font-medium py-2">Item</th>
                    <th className="text-left text-[11px] uppercase text-text-secondary font-medium py-2">Status</th>
                    <th className="text-left text-[11px] uppercase text-text-secondary font-medium py-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasInspecoes.map((ins) => (
                    <tr key={ins.id} className="border-b border-[#EEEEEE] hover:bg-gray-50">
                      <td className="py-2 text-[12px]">{ins.formulario_codigo}</td>
                      <td className="py-2 text-[12px] text-blue-accent font-medium">{ins.item_codigo}</td>
                      <td className="py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${statusBadgeClasses[ins.status || ''] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[ins.status || ''] || ins.status || 'Não selecionado'}
                        </span>
                      </td>
                      <td className="py-2 text-[12px] text-text-secondary">
                        {new Date(ins.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
