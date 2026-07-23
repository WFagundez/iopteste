# IOPtestes — Sistema de Inspeção e Testes

Aplicação full-stack para gerenciamento de checklists de inspeção em manufatura.

## Estrutura

```
ioptestes/
├── backend/          # API Node.js + Express + SQLite
│   ├── package.json
│   └── src/
│       └── index.js  # Servidor principal com todas as rotas
└── frontend/         # React + TypeScript + Tailwind + Vite
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── api.ts
        ├── context.tsx
        ├── types/
        │   └── index.ts
        ├── components/
        │   └── Layout.tsx
        └── pages/
            ├── Dashboard.tsx
            ├── ItemsPage.tsx
            ├── FormulariosPage.tsx
            └── FormularioEditPage.tsx
```

## Como executar

### Backend
```bash
cd backend
npm install
npm start
```
Servidor roda em `http://localhost:3001`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend roda em `http://localhost:5173` com proxy para `/api`

## Funcionalidades

- **Dashboard**: Estatísticas, gráficos de não conformidades (barra horizontal), distribuição de status (donut) e tabela de últimas inspeções
- **Cadastro de Itens**: CRUD completo com filtros, importação de planilha Excel (.xlsx), validação de código único
- **Formulários**: Criação/edição com blocos arrastáveis, itens arrastáveis dentro de blocos, verificação de itens duplicados
- **Design**: Layout responsivo com sidebar colapsável, top bar fixa, breadcrumbs, toasts e estados de loading
