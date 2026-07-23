import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useApp } from '../context';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from 'lucide-react';
import type { Item, Bloco, BlocoItem } from '../types';

interface FormState {
  centro_produtivo: string;
  codigo: string;
  titulo: string;
  descricao: string;
  responsavel: string;
  blocos: Bloco[];
}

function SortableBloco({
  bloco,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdateName,
  onToggleCollapse,
  collapsed,
  allItems,
  onAddItems,
  onRemoveItem,
  onReorderItems,
  usedItemCodes,
}: {
  bloco: Bloco;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onUpdateName: (name: string) => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
  allItems: Item[];
  onAddItems: (codes: string[]) => void;
  onRemoveItem: (itemCode: string) => void;
  onReorderItems: (items: BlocoItem[]) => void;
  usedItemCodes: Set<string>;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(bloco.nome);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `bloco-${index}`, data: { type: 'bloco', index } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleNameBlur = () => {
    setEditingName(false);
    if (nameValue.trim()) {
      onUpdateName(nameValue.trim());
    } else {
      setNameValue(bloco.nome);
    }
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className="card mb-3">
        {/* Bloco Header */}
        <div className="flex items-center gap-2 p-3 border-b border-[#EEEEEE]">
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-text-secondary cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded"
          >
            <GripVertical size={16} />
          </button>

          {editingName ? (
            <input
              autoFocus
              className="input-field flex-1 text-[14px] font-medium"
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={e => e.key === 'Enter' && handleNameBlur()}
            />
          ) : (
            <span
              onClick={() => setEditingName(true)}
              className="flex-1 text-[14px] font-medium cursor-text hover:bg-gray-50 rounded px-1 -mx-1"
            >
              {bloco.nome}
            </span>
          )}

          <span className="text-[11px] text-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">
            {bloco.itens.length} item(s)
          </span>

          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 text-text-secondary hover:bg-gray-100 rounded disabled:opacity-30"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1 text-text-secondary hover:bg-gray-100 rounded disabled:opacity-30"
          >
            <ArrowDown size={14} />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1 text-text-secondary hover:bg-gray-100 rounded"
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={() => {
              if (bloco.itens.length > 0) {
                setShowDeleteConfirm(true);
              } else {
                onDelete();
              }
            }}
            className="p-1 text-text-secondary hover:text-status-red hover:bg-red-50 rounded"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Bloco Body */}
        {!collapsed && (
          <div className="p-3">
            {bloco.itens.length === 0 ? (
              <div className="text-center py-4 text-[12px] text-text-secondary">
                Nenhum item neste bloco.
              </div>
            ) : (
              <SortableContext
                items={bloco.itens.map(i => `item-${bloco.nome}-${i.item_codigo}`)}
                strategy={verticalListSortingStrategy}
              >
                {bloco.itens.map((item, idx) => {
                  const itemData = allItems.find(i => i.codigo === item.item_codigo);
                  return (
                    <SortableItemRow
                      key={`item-${bloco.nome}-${item.item_codigo}`}
                      id={`item-${bloco.nome}-${item.item_codigo}`}
                      item={item}
                      itemData={itemData}
                      onRemove={() => onRemoveItem(item.item_codigo)}
                      blocoNome={bloco.nome}
                    />
                  );
                })}
              </SortableContext>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 flex items-center gap-1.5 text-[12px] text-primary border border-primary rounded-lg px-3 py-1.5 hover:bg-primary-light transition-colors"
            >
              <Plus size={14} /> Adicionar item
            </button>
          </div>
        )}
      </div>

      {/* Add items modal */}
      {showAddModal && (
        <AddItemsModal
          blocoName={bloco.nome}
          allItems={allItems}
          usedItemCodes={usedItemCodes}
          onClose={() => setShowAddModal(false)}
          onConfirm={(codes) => { onAddItems(codes); setShowAddModal(false); }}
        />
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(4,44,83,0.25)' }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-status-yellow" size={20} />
              <h3 className="text-[14px] font-semibold">Confirmar exclusão</h3>
            </div>
            <p className="text-[12px] text-text-secondary mb-4">
              Este bloco contém {bloco.itens.length} item(s). Excluir mesmo assim?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-[12px]">Cancelar</button>
              <button onClick={() => { onDelete(); setShowDeleteConfirm(false); }} className="btn-danger text-[12px]">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SortableItemRow({ id, item, itemData, onRemove, blocoNome }: {
  id: string;
  item: BlocoItem;
  itemData?: Item;
  onRemove: () => void;
  blocoNome: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: 'item', blocoNome } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 py-2 px-2 hover:bg-gray-50 rounded border-b border-[#F0F0F0] last:border-0"
    >
      <button {...attributes} {...listeners} className="p-1 text-text-secondary cursor-grab active:cursor-grabbing">
        <GripVertical size={14} />
      </button>
      <span className="text-[12px] font-bold text-blue-accent min-w-[50px]">{item.item_codigo}</span>
      <span className="text-[12px] flex-1 truncate">{itemData?.titulo || item.item_codigo}</span>
      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">{itemData?.tipo_dado || '-'}</span>
      <button
        onClick={onRemove}
        className="p-1 text-text-secondary hover:text-status-red rounded"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function AddItemsModal({
  blocoName,
  allItems,
  usedItemCodes,
  onClose,
  onConfirm,
}: {
  blocoName: string;
  allItems: Item[];
  usedItemCodes: Set<string>;
  onClose: () => void;
  onConfirm: (codes: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = allItems.filter(i =>
    i.codigo.toLowerCase().includes(search.toLowerCase()) ||
    i.titulo.toLowerCase().includes(search.toLowerCase())
  );

  const toggleItem = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(4,44,83,0.25)' }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#EEEEEE]">
          <h3 className="text-[14px] font-semibold">Adicionar itens ao bloco {blocoName}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>

        <div className="p-3 border-b border-[#EEEEEE]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              className="input-field w-full pl-9"
              placeholder="Buscar item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map(item => {
            const isUsed = usedItemCodes.has(item.codigo);
            const isSelected = selected.has(item.codigo);
            return (
              <div
                key={item.codigo}
                onClick={() => !isUsed && toggleItem(item.codigo)}
                className={`flex items-center gap-3 p-2 rounded ${
                  isUsed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
                } ${isSelected ? 'bg-blue-light' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isUsed}
                  onChange={() => !isUsed && toggleItem(item.codigo)}
                  className="rounded border-gray-300 text-primary"
                />
                <span className="text-[12px] font-bold text-blue-accent min-w-[60px]">{item.codigo}</span>
                <span className="text-[12px] flex-1">{item.titulo}</span>
                {isUsed && <span className="text-[10px] text-text-secondary">(já adicionado)</span>}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-[#EEEEEE]">
          <span className="text-[12px] text-text-secondary">{selected.size} item(s) selecionado(s)</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary text-[12px]">Cancelar</button>
            <button
              onClick={() => onConfirm(Array.from(selected))}
              disabled={selected.size === 0}
              className="btn-primary text-[12px] disabled:opacity-50"
            >
              Confirmar seleção
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FormularioEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useApp();
  const isNew = id === 'new';

  const [form, setForm] = useState<FormState>({
    centro_produtivo: '1010',
    codigo: '',
    titulo: '',
    descricao: '',
    responsavel: '',
    blocos: [],
  });
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [collapsedBlocos, setCollapsedBlocos] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<{ codigo?: string; titulo?: string; geral?: string }>({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  useEffect(() => {
    api.getItems().then(setAllItems);
    if (!isNew && id) {
      api.getFormulario(id).then(data => {
        setForm({
          centro_produtivo: data.centro_produtivo,
          codigo: data.codigo,
          titulo: data.titulo,
          descricao: data.descricao || '',
          responsavel: data.responsavel || '',
          blocos: data.blocos.map((b: any) => ({
            ...b,
            itens: b.itens.map((i: any) => ({
              item_codigo: i.item_codigo,
              ordem: i.ordem,
            })),
          })),
        });
        setLoading(false);
      }).catch(err => {
        addToast('error', err.message);
        setLoading(false);
      });
    }
  }, [id, isNew, addToast]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const usedItemCodes = new Set(
    form.blocos.flatMap(b => b.itens.map(i => i.item_codigo))
  );

  const addBloco = () => {
    setForm(f => ({
      ...f,
      blocos: [...f.blocos, { nome: 'Novo bloco', ordem: f.blocos.length, itens: [] }],
    }));
  };

  const updateBlocoName = (idx: number, name: string) => {
    setForm(f => ({
      ...f,
      blocos: f.blocos.map((b, i) => i === idx ? { ...b, nome: name } : b),
    }));
  };

  const moveBloco = (idx: number, direction: number) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= form.blocos.length) return;
    const newBlocos = [...form.blocos];
    [newBlocos[idx], newBlocos[newIdx]] = [newBlocos[newIdx], newBlocos[idx]];
    setForm(f => ({ ...f, blocos: newBlocos }));
  };

  const deleteBloco = (idx: number) => {
    setForm(f => ({ ...f, blocos: f.blocos.filter((_, i) => i !== idx) }));
  };

  const addItemsToBloco = (blocoIdx: number, codes: string[]) => {
    setForm(f => ({
      ...f,
      blocos: f.blocos.map((b, i) => {
        if (i !== blocoIdx) return b;
        const newItems = codes.map((code, idx) => ({
          item_codigo: code,
          ordem: b.itens.length + idx,
        }));
        return { ...b, itens: [...b.itens, ...newItems] };
      }),
    }));
  };

  const removeItemFromBloco = (blocoIdx: number, itemCode: string) => {
    setForm(f => ({
      ...f,
      blocos: f.blocos.map((b, i) => {
        if (i !== blocoIdx) return b;
        return { ...b, itens: b.itens.filter(it => it.item_codigo !== itemCode) };
      }),
    }));
  };

  const reorderItemsInBloco = (blocoIdx: number, items: BlocoItem[]) => {
    setForm(f => ({
      ...f,
      blocos: f.blocos.map((b, i) => i === blocoIdx ? { ...b, itens } : b),
    }));
  };

  const toggleCollapse = (idx: number) => {
    setCollapsedBlocos(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSave = async () => {
    const newErrors: typeof errors = {};
    if (!form.codigo.trim()) newErrors.codigo = 'Código é obrigatório';
    if (!form.titulo.trim()) newErrors.titulo = 'Título é obrigatório';
    if (form.blocos.length === 0 || form.blocos.every(b => b.itens.length === 0)) {
      newErrors.geral = 'Adicione pelo menos um bloco com itens.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.geral) addToast('error', newErrors.geral);
      return;
    }

    const payload = {
      ...form,
      blocos: form.blocos.map((b, bIdx) => ({
        nome: b.nome,
        ordem: bIdx,
        itens: b.itens.map((it, iIdx) => ({
          item_codigo: it.item_codigo,
          ordem: iIdx,
        })),
      })),
    };

    try {
      if (isNew) {
        await api.createFormulario(payload);
      } else if (id) {
        await api.updateFormulario(id, payload);
      }
      addToast('success', 'Formulário salvo com sucesso.');
      navigate('/formularios');
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao salvar formulário');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton w-full h-12" />
        <div className="skeleton w-full h-64" />
        <div className="skeleton w-full h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-semibold">
          {isNew ? 'Cadastro de formulário' : 'Editar formulário'}
        </h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/formularios')} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} className="btn-primary">Salvar</button>
        </div>
      </div>

      {/* Info fields */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-text-secondary mb-1 block">Centro produtivo</label>
            <select className="input-field w-full bg-gray-100" disabled value={form.centro_produtivo}>
              <option>1010</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-text-secondary mb-1 block">Responsável</label>
            <input
              type="text"
              className="input-field w-full"
              value={form.responsavel}
              onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-text-secondary mb-1 block">Código *</label>
            <input
              type="text"
              className={`input-field w-full ${errors.codigo ? 'border-status-red' : ''}`}
              value={form.codigo}
              onChange={e => { setForm(f => ({ ...f, codigo: e.target.value })); setErrors(e => ({ ...e, codigo: undefined })); }}
            />
            {errors.codigo && <p className="text-[11px] text-status-red mt-1">{errors.codigo}</p>}
          </div>
          <div>
            <label className="text-[11px] text-text-secondary mb-1 block">Título *</label>
            <input
              type="text"
              className={`input-field w-full ${errors.titulo ? 'border-status-red' : ''}`}
              value={form.titulo}
              onChange={e => { setForm(f => ({ ...f, titulo: e.target.value })); setErrors(e => ({ ...e, titulo: undefined })); }}
            />
            {errors.titulo && <p className="text-[11px] text-status-red mt-1">{errors.titulo}</p>}
          </div>
        </div>
        <div>
          <label className="text-[11px] text-text-secondary mb-1 block">Descrição</label>
          <textarea
            className="input-field w-full"
            rows={3}
            value={form.descricao}
            onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
          />
        </div>
      </div>

      {/* Blocos section */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold">Blocos do formulário</h2>
          <button
            onClick={addBloco}
            className="flex items-center gap-1.5 text-[12px] text-primary border border-primary rounded-lg px-3 py-1.5 hover:bg-primary-light transition-colors"
          >
            <Plus size={14} /> Adicionar bloco
          </button>
        </div>

        {errors.geral && (
          <div className="bg-red-50 border border-red-200 text-status-red rounded-lg p-3 mb-3 text-[12px]">
            {errors.geral}
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveDragId(active.id as string)}
          onDragEnd={({ active, over }) => {
            setActiveDragId(null);
            if (!over || active.id === over.id) return;

            const activeType = (active.data.current as any)?.type;

            if (activeType === 'item') {
              const blocoNome = (active.data.current as any)?.blocoNome;
              setForm(f => ({
                ...f,
                blocos: f.blocos.map(b => {
                  if (b.nome !== blocoNome) return b;
                  const oldIndex = b.itens.findIndex(i => `item-${b.nome}-${i.item_codigo}` === active.id);
                  const newIndex = b.itens.findIndex(i => `item-${b.nome}-${i.item_codigo}` === over.id);
                  if (oldIndex === -1 || newIndex === -1) return b;
                  return { ...b, itens: arrayMove(b.itens, oldIndex, newIndex) };
                }),
              }));
              return;
            }

            const oldIndex = form.blocos.findIndex((_, i) => `bloco-${i}` === active.id);
            const newIndex = form.blocos.findIndex((_, i) => `bloco-${i}` === over.id);
            setForm(f => ({ ...f, blocos: arrayMove(f.blocos, oldIndex, newIndex) }));
          }}
        >
          <SortableContext
            items={form.blocos.map((_, i) => `bloco-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            {form.blocos.map((bloco, idx) => (
              <SortableBloco
                key={`bloco-${idx}`}
                bloco={bloco}
                index={idx}
                total={form.blocos.length}
                onMoveUp={() => moveBloco(idx, -1)}
                onMoveDown={() => moveBloco(idx, 1)}
                onDelete={() => deleteBloco(idx)}
                onUpdateName={name => updateBlocoName(idx, name)}
                onToggleCollapse={() => toggleCollapse(idx)}
                collapsed={collapsedBlocos.has(idx)}
                allItems={allItems}
                onAddItems={codes => addItemsToBloco(idx, codes)}
                onRemoveItem={code => removeItemFromBloco(idx, code)}
                onReorderItems={items => reorderItemsInBloco(idx, items)}
                usedItemCodes={usedItemCodes}
              />
            ))}
          </SortableContext>
        </DndContext>

        {form.blocos.length === 0 && (
          <div className="text-center py-8 text-text-secondary text-[13px]">
            Nenhum bloco adicionado. Clique em "Adicionar bloco" para começar.
          </div>
        )}
      </div>
    </div>
  );
}
