const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Initialize database
const db = new Database('./database.sqlite');
db.pragma('journal_mode = WAL');

// Standard options for "Lista de seleção única"
const STANDARD_OPCOES = JSON.stringify([
  { texto: "Aprovado", aprova: true },
  { texto: "Aprovado com ressalvas", aprova: true },
  { texto: "Reprovado", aprova: false },
  { texto: "Não se Aplica", aprova: true }
]);

// Create tables
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      centro_produtivo TEXT DEFAULT '1010',
      tipo_dado TEXT NOT NULL,
      codigo TEXT UNIQUE NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      opcoes TEXT,
      habilita_foto INTEGER DEFAULT 0,
      validade TEXT DEFAULT '31/12/9999',
      criado_em TEXT DEFAULT (datetime('now')),
      modificado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS formularios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      centro_produtivo TEXT DEFAULT '1010',
      codigo TEXT UNIQUE NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      responsavel TEXT,
      validade TEXT DEFAULT '31/12/9999',
      criado_em TEXT DEFAULT (datetime('now')),
      modificado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS formulario_blocos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formulario_id INTEGER REFERENCES formularios(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      ordem INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS formulario_bloco_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bloco_id INTEGER REFERENCES formulario_blocos(id) ON DELETE CASCADE,
      item_codigo TEXT REFERENCES items(codigo),
      ordem INTEGER DEFAULT 0,
      UNIQUE(bloco_id, item_codigo)
    );

    CREATE TABLE IF NOT EXISTS inspecoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formulario_id INTEGER REFERENCES formularios(id),
      item_codigo TEXT,
      status TEXT,
      criado_em TEXT DEFAULT (datetime('now'))
    );
  `);
}

initDatabase();

// Seed data
function seedData() {
  const itemsCount = db.prepare('SELECT COUNT(*) as count FROM items').get();
  if (itemsCount.count === 0) {
    const items = [
      { codigo: '01.01', titulo: '01.01 Lacre dos parafusos (Ap. Levant. e suspensão)', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.02', titulo: '01.02 Soldas dos suportes da suspensão', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.03', titulo: '01.03 Soldas dos reforços da suspensão', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.04', titulo: '01.04 Soldas suportes do ap. levantamento', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.05', titulo: '01.05 Solda mesa acoplamento/pino-rei', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.06', titulo: '01.06 Fixação dos parafusos e modelo da 5ª roda', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.07', titulo: '01.07 Travas e componentes da trava do Dolly', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.08', titulo: '01.08 Verificar remoção da trava do eixo', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.09', titulo: '01.09 Verificar remoção das travas das câmaras de freio', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.10', titulo: '01.10 Verificar plaqueta do eixo quanto a capacidade', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.11', titulo: '01.11 Engate Esférico — verificação do engate, pino, corrente', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.12', titulo: '01.12 Montagem Câmaras e Compensadores de Freio', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.13', titulo: '01.13 Conferência da chapa rebitada no para-choque', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.14', titulo: '01.14 Verificar montagem do conector no Bocal da boia', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.15', titulo: '01.15 Verificar montagem e instalação do Randon Smart', tipo_dado: 'Lista de seleção única' },
      { codigo: '01.16', titulo: '01.16 Verificar fixação dos parafusos das calotas do cubo', tipo_dado: 'Lista de seleção única' },
      { codigo: '02.01', titulo: '02.01 Fixação da fiação do ABS junto à instalação pneumática', tipo_dado: 'Lista de seleção única' },
      { codigo: '02.06', titulo: '02.06 Batentes da suspensão pneumática', tipo_dado: 'Lista de seleção única' },
      { codigo: '02.07', titulo: '02.07 Travas e parafusos do quadro auto direcional', tipo_dado: 'Lista de seleção única' },
      { codigo: '02.10', titulo: '02.10 Verificar aperto e lacre do parafuso M30 da suspensão', tipo_dado: 'Lista de seleção única' },
      { codigo: '02.12', titulo: '02.12 Verificar modelo do engate esférico conforme projeto', tipo_dado: 'Lista de seleção única' },
      { codigo: 'US.01', titulo: 'Usinagem — Diâmetro externo do eixo principal', tipo_dado: 'Numérico' },
      { codigo: 'EL.01', titulo: 'Elétrica — Observações gerais do chicote', tipo_dado: 'Texto livre' }
    ];

    const insertItem = db.prepare(`
      INSERT INTO items (centro_produtivo, tipo_dado, codigo, titulo, opcoes, validade)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    items.forEach(item => {
      const opcoes = item.tipo_dado === 'Lista de seleção única' ? STANDARD_OPCOES : null;
      insertItem.run('1010', item.tipo_dado, item.codigo, item.titulo, opcoes, '31/12/9999');
    });
  }

  const formsCount = db.prepare('SELECT COUNT(*) as count FROM formularios').get();
  if (formsCount.count === 0) {
    const form = db.prepare(`
      INSERT INTO formularios (centro_produtivo, codigo, titulo, descricao, responsavel, validade)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('1010', 'D0', 'Inspeção 5ª Roda — Checklist completo', '', 'Lara Crespi', '31/12/9999');

    const formId = form.lastInsertRowid;

    // Bloco 01
    const bloco1 = db.prepare(`
      INSERT INTO formulario_blocos (formulario_id, nome, ordem) VALUES (?, ?, ?)
    `).run(formId, 'Bloco 01 — Suspensão e Freios', 0);
    const bloco1Id = bloco1.lastInsertRowid;

    const bloco1Items = ['01.01', '01.02', '01.03', '01.04', '01.05', '01.06', '01.09', '01.12'];
    bloco1Items.forEach((codigo, idx) => {
      db.prepare(`INSERT INTO formulario_bloco_itens (bloco_id, item_codigo, ordem) VALUES (?, ?, ?)`)
        .run(bloco1Id, codigo, idx);
    });

    // Bloco 02
    const bloco2 = db.prepare(`
      INSERT INTO formulario_blocos (formulario_id, nome, ordem) VALUES (?, ?, ?)
    `).run(formId, 'Bloco 02 — Verificações Gerais', 1);
    const bloco2Id = bloco2.lastInsertRowid;

    const bloco2Items = ['02.06', '02.07', '02.10', '02.12', '01.11', '01.14'];
    bloco2Items.forEach((codigo, idx) => {
      db.prepare(`INSERT INTO formulario_bloco_itens (bloco_id, item_codigo, ordem) VALUES (?, ?, ?)`)
        .run(bloco2Id, codigo, idx);
    });
  }

  const inspecoesCount = db.prepare('SELECT COUNT(*) as count FROM inspecoes').get();
  if (inspecoesCount.count === 0) {
    const itemCodes = db.prepare('SELECT codigo FROM items').all().map(r => r.codigo);
    const formId = db.prepare('SELECT id FROM formularios WHERE codigo = ?').get('D0').id;

    const statuses = ['aprovado', 'aprovado_ressalvas', 'reprovado', 'nao_aplica'];
    const weights = [0.55, 0.15, 0.25, 0.05];

    function getWeightedStatus() {
      const rand = Math.random();
      let sum = 0;
      for (let i = 0; i < statuses.length; i++) {
        sum += weights[i];
        if (rand <= sum) return statuses[i];
      }
      return statuses[0];
    }

    const insertInspecao = db.prepare(`
      INSERT INTO inspecoes (formulario_id, item_codigo, status, criado_em)
      VALUES (?, ?, ?, datetime('now', ? || ' days'))
    `);

    for (let i = 0; i < 80; i++) {
      const itemCodigo = itemCodes[Math.floor(Math.random() * itemCodes.length)];
      let status = getWeightedStatus();

      // Make 01.06, 02.10, 01.09 have high reprovado counts
      if (['01.06', '02.10', '01.09'].includes(itemCodigo) && Math.random() < 0.7) {
        status = 'reprovado';
      }

      const daysAgo = -Math.floor(Math.random() * 30);
      insertInspecao.run(formId, itemCodigo, status, daysAgo);
    }
  }
}

seedData();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ==================== ITEMS ROUTES ====================

// GET /api/items
app.get('/api/items', (req, res) => {
  try {
    let query = 'SELECT * FROM items WHERE 1=1';
    const params = [];

    if (req.query.codigo) {
      query += ' AND codigo LIKE ?';
      params.push(`%${req.query.codigo}%`);
    }
    if (req.query.titulo) {
      query += ' AND titulo LIKE ?';
      params.push(`%${req.query.titulo}%`);
    }
    if (req.query.tipo_dado) {
      query += ' AND tipo_dado = ?';
      params.push(req.query.tipo_dado);
    }

    query += ' ORDER BY codigo';
    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/:codigo
app.get('/api/items/:codigo', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM items WHERE codigo = ?').get(req.params.codigo);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items
app.post('/api/items', (req, res) => {
  try {
    const { centro_produtivo, tipo_dado, codigo, titulo, descricao, habilita_foto } = req.body;

    const existing = db.prepare('SELECT id FROM items WHERE codigo = ?').get(codigo);
    if (existing) {
      return res.status(409).json({ error: 'Código já existe' });
    }

    const opcoes = tipo_dado === 'Lista de seleção única' ? STANDARD_OPCOES : null;

    const result = db.prepare(`
      INSERT INTO items (centro_produtivo, tipo_dado, codigo, titulo, descricao, opcoes, habilita_foto)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(centro_produtivo || '1010', tipo_dado, codigo, titulo, descricao || null, opcoes, habilita_foto ? 1 : 0);

    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/items/:codigo
app.put('/api/items/:codigo', (req, res) => {
  try {
    const { centro_produtivo, tipo_dado, codigo: newCodigo, titulo, descricao, habilita_foto } = req.body;

    if (newCodigo !== req.params.codigo) {
      const existing = db.prepare('SELECT id FROM items WHERE codigo = ? AND codigo != ?').get(newCodigo, req.params.codigo);
      if (existing) {
        return res.status(409).json({ error: 'Novo código já está em uso' });
      }
    }

    const opcoes = tipo_dado === 'Lista de seleção única' ? STANDARD_OPCOES : null;

    db.prepare(`
      UPDATE items SET
        centro_produtivo = ?,
        tipo_dado = ?,
        codigo = ?,
        titulo = ?,
        descricao = ?,
        opcoes = ?,
        habilita_foto = ?,
        modificado_em = datetime('now')
      WHERE codigo = ?
    `).run(centro_produtivo || '1010', tipo_dado, newCodigo, titulo, descricao || null, opcoes, habilita_foto ? 1 : 0, req.params.codigo);

    const updatedItem = db.prepare('SELECT * FROM items WHERE codigo = ?').get(newCodigo);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/:codigo/check
app.get('/api/items/:codigo/check', (req, res) => {
  try {
    const item = db.prepare('SELECT id FROM items WHERE codigo = ?').get(req.params.codigo);
    if (!item) return res.json({ em_uso: false, formularios: [] });

    const formularios = db.prepare(`
      SELECT DISTINCT f.id, f.codigo, f.titulo
      FROM formularios f
      JOIN formulario_blocos fb ON fb.formulario_id = f.id
      JOIN formulario_bloco_itens fbi ON fbi.bloco_id = fb.id
      WHERE fbi.item_codigo = ?
    `).all(req.params.codigo);

    res.json({ em_uso: formularios.length > 0, formularios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/items/:codigo
app.delete('/api/items/:codigo', (req, res) => {
  try {
    const item = db.prepare('SELECT id FROM items WHERE codigo = ?').get(req.params.codigo);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const formularios = db.prepare(`
      SELECT DISTINCT f.id, f.codigo, f.titulo
      FROM formularios f
      JOIN formulario_blocos fb ON fb.formulario_id = f.id
      JOIN formulario_bloco_itens fbi ON fbi.bloco_id = fb.id
      WHERE fbi.item_codigo = ?
    `).all(req.params.codigo);

    if (formularios.length > 0) {
      return res.status(409).json({ em_uso: true, formularios });
    }

    db.prepare('DELETE FROM items WHERE codigo = ?').run(req.params.codigo);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items/import
app.post('/api/items/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const validTipos = ['Lista de seleção única', 'Texto livre', 'Numérico'];
    const results = { imported: 0, skipped: 0, errors: [] };

    // Skip header row (row 1), start from row 2 (index 1)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const centro_produtivo = row[0] || '1010';
      const tipo_dado = row[1];
      const codigo = row[2];
      const titulo = row[3];
      const descricao = row[4] || '';
      const validade = row[7] || '31/12/9999';

      if (!codigo || !titulo) {
        results.errors.push({ row: rowNum, field: !codigo ? 'codigo' : 'titulo', reason: 'Campo obrigatório' });
        continue;
      }

      if (!validTipos.includes(tipo_dado)) {
        results.errors.push({ row: rowNum, field: 'tipo_dado', reason: 'Tipo inválido' });
        continue;
      }

      const existing = db.prepare('SELECT id FROM items WHERE codigo = ?').get(codigo);
      if (existing) {
        results.skipped++;
        continue;
      }

      const opcoes = tipo_dado === 'Lista de seleção única' ? STANDARD_OPCOES : null;

      db.prepare(`
        INSERT INTO items (centro_produtivo, tipo_dado, codigo, titulo, descricao, opcoes, validade)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(centro_produtivo, tipo_dado, String(codigo), titulo, descricao, opcoes, validade);

      results.imported++;
    }

    fs.unlinkSync(req.file.path);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== FORMULARIOS ROUTES ====================

// GET /api/formularios
app.get('/api/formularios', (req, res) => {
  try {
    const forms = db.prepare(`
      SELECT f.*,
        (SELECT COUNT(*) FROM formulario_blocos WHERE formulario_id = f.id) as num_blocos,
        (SELECT COUNT(*) FROM formulario_bloco_itens fbi
         JOIN formulario_blocos fb ON fb.id = fbi.bloco_id
         WHERE fb.formulario_id = f.id) as num_itens
      FROM formularios f
      ORDER BY f.id DESC
    `).all();
    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/formularios/:id
app.get('/api/formularios/:id', (req, res) => {
  try {
    const form = db.prepare('SELECT * FROM formularios WHERE id = ?').get(req.params.id);
    if (!form) return res.status(404).json({ error: 'Formulário not found' });

    const blocos = db.prepare(`
      SELECT * FROM formulario_blocos WHERE formulario_id = ? ORDER BY ordem
    `).all(req.params.id);

    const blocosWithItems = blocos.map(bloco => {
      const itens = db.prepare(`
        SELECT fbi.id, fbi.item_codigo, fbi.ordem, i.titulo, i.tipo_dado
        FROM formulario_bloco_itens fbi
        JOIN items i ON i.codigo = fbi.item_codigo
        WHERE fbi.bloco_id = ?
        ORDER BY fbi.ordem
      `).all(bloco.id);
      return { ...bloco, itens };
    });

    res.json({ ...form, blocos: blocosWithItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/formularios
app.post('/api/formularios', (req, res) => {
  const transaction = db.transaction(() => {
    const { centro_produtivo, codigo, titulo, descricao, responsavel, blocos } = req.body;

    const existing = db.prepare('SELECT id FROM formularios WHERE codigo = ?').get(codigo);
    if (existing) throw new Error('Código já existe');

    const form = db.prepare(`
      INSERT INTO formularios (centro_produtivo, codigo, titulo, descricao, responsavel)
      VALUES (?, ?, ?, ?, ?)
    `).run(centro_produtivo || '1010', codigo, titulo, descricao || null, responsavel || null);

    const formId = form.lastInsertRowid;

    blocos.forEach((bloco, bIdx) => {
      const blocoResult = db.prepare(`
        INSERT INTO formulario_blocos (formulario_id, nome, ordem) VALUES (?, ?, ?)
      `).run(formId, bloco.nome, bIdx);

      const blocoId = blocoResult.lastInsertRowid;

      bloco.itens.forEach((item, iIdx) => {
        db.prepare(`
          INSERT INTO formulario_bloco_itens (bloco_id, item_codigo, ordem) VALUES (?, ?, ?)
        `).run(blocoId, item.item_codigo, iIdx);
      });
    });

    return formId;
  });

  try {
    const formId = transaction();
    const newForm = db.prepare('SELECT * FROM formularios WHERE id = ?').get(formId);
    res.status(201).json(newForm);
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// PUT /api/formularios/:id
app.put('/api/formularios/:id', (req, res) => {
  const transaction = db.transaction(() => {
    const { centro_produtivo, codigo, titulo, descricao, responsavel, blocos } = req.body;

    const existing = db.prepare('SELECT id FROM formularios WHERE codigo = ? AND id != ?').get(codigo, req.params.id);
    if (existing) throw new Error('Código já existe em outro formulário');

    db.prepare(`
      UPDATE formularios SET
        centro_produtivo = ?,
        codigo = ?,
        titulo = ?,
        descricao = ?,
        responsavel = ?,
        modificado_em = datetime('now')
      WHERE id = ?
    `).run(centro_produtivo || '1010', codigo, titulo, descricao || null, responsavel || null, req.params.id);

    // Delete existing blocos and items
    const existingBlocos = db.prepare('SELECT id FROM formulario_blocos WHERE formulario_id = ?').all(req.params.id);
    existingBlocos.forEach(b => {
      db.prepare('DELETE FROM formulario_bloco_itens WHERE bloco_id = ?').run(b.id);
    });
    db.prepare('DELETE FROM formulario_blocos WHERE formulario_id = ?').run(req.params.id);

    // Re-insert
    blocos.forEach((bloco, bIdx) => {
      const blocoResult = db.prepare(`
        INSERT INTO formulario_blocos (formulario_id, nome, ordem) VALUES (?, ?, ?)
      `).run(req.params.id, bloco.nome, bIdx);

      const blocoId = blocoResult.lastInsertRowid;

      bloco.itens.forEach((item, iIdx) => {
        db.prepare(`
          INSERT INTO formulario_bloco_itens (bloco_id, item_codigo, ordem) VALUES (?, ?, ?)
        `).run(blocoId, item.item_codigo, iIdx);
      });
    });

    return req.params.id;
  });

  try {
    transaction();
    const updatedForm = db.prepare('SELECT * FROM formularios WHERE id = ?').get(req.params.id);
    res.json(updatedForm);
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// DELETE /api/formularios/:id
app.delete('/api/formularios/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM formularios WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DASHBOARD ROUTES ====================

// GET /api/dashboard/stats
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const totalItems = db.prepare('SELECT COUNT(*) as count FROM items').get().count;
    const totalFormularios = db.prepare('SELECT COUNT(*) as count FROM formularios').get().count;
    const totalInspecoes = db.prepare('SELECT COUNT(*) as count FROM inspecoes').get().count;

    const aprovados = db.prepare(`
      SELECT COUNT(*) as count FROM inspecoes WHERE status IN ('aprovado', 'aprovado_ressalvas', 'nao_aplica')
    `).get().count;

    const taxaAprovacao = totalInspecoes > 0 ? Math.round((aprovados / totalInspecoes) * 100) : 0;

    res.json({ total_items: totalItems, total_formularios: totalFormularios, total_inspecoes: totalInspecoes, taxa_aprovacao: taxaAprovacao });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/nao-conformidades
app.get('/api/dashboard/nao-conformidades', (req, res) => {
  try {
    const results = db.prepare(`
      SELECT i.codigo as item_codigo, i.titulo as item_titulo, COUNT(*) as reprovado_count
      FROM inspecoes ins
      JOIN items i ON i.codigo = ins.item_codigo
      WHERE ins.status = 'reprovado'
      GROUP BY ins.item_codigo
      ORDER BY reprovado_count DESC
      LIMIT 10
    `).all();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/distribuicao-status
app.get('/api/dashboard/distribuicao-status', (req, res) => {
  try {
    const results = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM inspecoes
      WHERE status IS NOT NULL
      GROUP BY status
    `).all();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/ultimas-inspecoes
app.get('/api/dashboard/ultimas-inspecoes', (req, res) => {
  try {
    const results = db.prepare(`
      SELECT ins.*, f.codigo as formulario_codigo, f.titulo as formulario_titulo, i.titulo as item_titulo
      FROM inspecoes ins
      LEFT JOIN formularios f ON f.id = ins.formulario_id
      LEFT JOIN items i ON i.codigo = ins.item_codigo
      ORDER BY ins.criado_em DESC
      LIMIT 20
    `).all();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== INSPECOES ROUTES ====================

// POST /api/inspecoes/batch
app.post('/api/inspecoes/batch', (req, res) => {
  try {
    const { formulario_id, respostas } = req.body;
    const insert = db.prepare(`
      INSERT INTO inspecoes (formulario_id, item_codigo, status) VALUES (?, ?, ?)
    `);

    respostas.forEach(r => {
      insert.run(formulario_id, r.item_codigo, r.status);
    });

    res.json({ success: true, count: respostas.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`IOPtestes API running on port ${PORT}`);
});
