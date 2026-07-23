export interface Item {
  id: number;
  centro_produtivo: string;
  tipo_dado: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  opcoes: string | null;
  habilita_foto: number;
  validade: string;
  criado_em: string;
  modificado_em: string;
}

export interface Formulario {
  id: number;
  centro_produtivo: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  responsavel: string | null;
  validade: string;
  criado_em: string;
  modificado_em: string;
  num_blocos?: number;
  num_itens?: number;
}

export interface Bloco {
  id?: number;
  formulario_id?: number;
  nome: string;
  ordem: number;
  itens: BlocoItem[];
}

export interface BlocoItem {
  id?: number;
  bloco_id?: number;
  item_codigo: string;
  ordem: number;
  titulo?: string;
  tipo_dado?: string;
}

export interface Inspecao {
  id: number;
  formulario_id: number;
  item_codigo: string;
  status: string | null;
  criado_em: string;
  formulario_codigo?: string;
  formulario_titulo?: string;
  item_titulo?: string;
}

export interface DashboardStats {
  total_items: number;
  total_formularios: number;
  total_inspecoes: number;
  taxa_aprovacao: number;
}

export interface NaoConformidade {
  item_codigo: string;
  item_titulo: string;
  reprovado_count: number;
}

export interface DistribuicaoStatus {
  status: string;
  count: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
}
