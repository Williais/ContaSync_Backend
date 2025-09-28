import express from 'express';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import cors from 'cors';
import 'dotenv/config';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';

const app = express();
const pgSession = connectPgSimple(session)

// CONEXÃO COM O BANCO DE DADOS
const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// MIDDLEWARES E CONFIG
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'user_sessions' 
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
    }
}));
app.use(passport.initialize());
app.use(passport.session());


// ESTRATÉGIA DE AUTENTICAÇÃO
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    const { id, displayName, emails, photos } = profile;
    const email = emails[0].value;
    const foto_url = photos[0].value;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE google_id = $1', [id]);
        if (result.rowCount > 0) {
            return done(null, result.rows[0]);
        } else {
            const newUserResult = await pool.query(
                'INSERT INTO usuarios (google_id, nome, email, foto_url) VALUES ($1, $2, $3, $4) RETURNING *',
                [id, displayName, email, foto_url]
            );
            return done(null, newUserResult.rows[0]);
        }
    } catch (err) { return done(err, null); }
  }
));

passport.serializeUser((user, done) => { done(null, user.id); });
passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (result.rowCount > 0) { done(null, result.rows[0]); }
    } catch (err) { done(err, null); }
});

// MIDDLEWARE DE AUTENTICAÇÃO
const isAuth = (req, res, next) => {
    if (req.user) { next(); } 
    else { res.status(401).json({ mensagem: 'Não autorizado.' }); }
};

//verificar se a API está no ar.
app.get('/', (req, res) => {
    res.status(200).json({ status: 'API is running' });
});

// --- ROTAS DE AUTENTICAÇÃO ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { successRedirect: process.env.CLIENT_URL, failureRedirect: `${process.env.CLIENT_URL}/login` }));
app.get('/auth/user', isAuth, (req, res) => { res.status(200).json(req.user); });
app.get('/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect(process.env.CLIENT_URL);
    });
});

// --- ROTAS PARA CATEGORIAS (CRUD COMPLETO) ---
app.get('/categorias', isAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM categorias WHERE usuario_id = $1 ORDER BY nome ASC', [req.user.id]);
        res.json(rows);
    } catch (err) { res.status(500).send('Erro ao buscar categorias.'); }
});

app.post('/categorias', isAuth, async (req, res) => {
    const { nome, tipo } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO categorias (nome, tipo, usuario_id) VALUES ($1, $2, $3) RETURNING *',
            [nome, tipo, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).send('Erro ao criar categoria.'); }
});

app.put('/categorias/:id', isAuth, async (req, res) => {
    const { id } = req.params;
    const { nome, tipo } = req.body;
    try {
        const result = await pool.query(
            'UPDATE categorias SET nome = $1, tipo = $2 WHERE id = $3 AND usuario_id = $4 RETURNING *',
            [nome, tipo, id, req.user.id]
        );
        if (result.rowCount === 0) { return res.status(404).send('Categoria não encontrada.'); }
        res.status(200).json(result.rows[0]);
    } catch (err) { res.status(500).send('Erro ao atualizar categoria.'); }
});

app.delete('/categorias/:id', isAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM categorias WHERE id = $1 AND usuario_id = $2', [id, req.user.id]);
        if (result.rowCount === 0) { return res.status(404).send('Categoria não encontrada.'); }
        res.status(204).send();
    } catch (err) { res.status(500).send('Erro ao deletar categoria.'); }
});


// --- ROTAS PARA TRANSAÇÕES (CRUD COMPLETO) ---
app.get('/transacoes', isAuth, async (req, res) => {
    // 1. Captura os parâmetros de consulta da URL (se existirem)
    const { ano, mes } = req.query;
    const usuarioId = req.user.id;

    try {
        let queryText = 'SELECT * FROM transacoes WHERE usuario_id = $1';
        const queryParams = [usuarioId];
        let paramIndex = 2; // Começamos no $2, pois $1 já é o usuario_id

        // 2. Adiciona as condições de filtro APENAS se os parâmetros foram fornecidos
        if (ano) {
            queryText += ` AND EXTRACT(YEAR FROM data_transacao) = $${paramIndex}`;
            queryParams.push(ano);
            paramIndex++;
        }
        if (mes) {
            queryText += ` AND EXTRACT(MONTH FROM data_transacao) = $${paramIndex}`;
            queryParams.push(mes);
            paramIndex++;
        }
        
        // 3. Adiciona a ordenação no final
        queryText += ' ORDER BY data_transacao DESC';

        // 4. Executa a query final (seja ela a simples ou a com filtros)
        const { rows } = await pool.query(queryText, queryParams);
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar transações:', err);
        res.status(500).send('Erro ao buscar transações.');
    }
});

app.get('/transacoes/:id', isAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const { rows, rowCount } = await pool.query('SELECT * FROM transacoes WHERE id = $1 AND usuario_id = $2', [id, req.user.id]);
        if (rowCount === 0) { return res.status(404).json({ mensagem: 'Transação não encontrada.' }); }
        res.status(200).json(rows[0]);
    } catch (err) { res.status(500).send('Erro ao buscar transação.'); }
});

app.post('/transacoes', isAuth, async (req, res) => {
    const { descricao, valor, tipo_transacao, categoria_id, data_transacao, tipo_despesa, data_vencimento, precisa_aviso } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO transacoes (descricao, valor, tipo_transacao, categoria_id, data_transacao, tipo_despesa, data_vencimento, precisa_aviso, usuario_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [descricao, valor, tipo_transacao, categoria_id, data_transacao, tipo_despesa, data_vencimento, precisa_aviso, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).send('Erro ao criar transação.'); }
});

app.put('/transacoes/:id', isAuth, async (req, res) => {
    const { id } = req.params;
    const { descricao, valor, tipo_transacao, categoria_id, data_transacao, tipo_despesa, data_vencimento, precisa_aviso } = req.body;
    try {
        const result = await pool.query(
            `UPDATE transacoes 
             SET descricao = $1, valor = $2, tipo_transacao = $3, categoria_id = $4, data_transacao = $5, tipo_despesa = $6, data_vencimento = $7, precisa_aviso = $8 
             WHERE id = $9 AND usuario_id = $10 RETURNING *`,
            [descricao, valor, tipo_transacao, categoria_id, data_transacao, tipo_despesa, data_vencimento, precisa_aviso, id, req.user.id]
        );
        if (result.rowCount === 0) { return res.status(404).send('Transação não encontrada.'); }
        res.status(200).json(result.rows[0]);
    } catch (err) { res.status(500).send('Erro ao atualizar transação.'); }
});

app.delete('/transacoes/:id', isAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM transacoes WHERE id = $1 AND usuario_id = $2', [id, req.user.id]);
        if (result.rowCount === 0) { return res.status(404).send('Transação não encontrada.'); }
        res.status(204).send();
    } catch (err) { res.status(500).send('Erro ao deletar transação.'); }
});

// INICIALIZAÇÃO DO SERVIDOR
const PORT_RENDER = process.env.PORT || 3000;
app.listen(PORT_RENDER, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT_RENDER}`);
});