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


