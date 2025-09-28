# ContaSync - API do Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Passport.js](https://img.shields.io/badge/Passport.js-34E27A?style=for-the-badge&logo=passport&logoColor=white)

## 📖 Sobre o Projeto

O **ContaSync** é uma API RESTful robusta, construída como o "cérebro" de uma aplicação de gestão financeira pessoal. O objetivo principal deste backend é oferecer uma plataforma segura e eficiente para que múltiplos usuários possam gerenciar suas finanças, registrando proventos e despesas, categorizando transações e, futuramente, recebendo lembretes de pagamentos.

Este projeto foi desenvolvido como um estudo aprofundado de tecnologias de backend modernas, com foco em segurança, escalabilidade e boas práticas de desenvolvimento.

---

## 🚀 Funcionalidades Principais

- **Autenticação Segura com Google (OAuth 2.0):** Utiliza o Passport.js para gerenciar o login, garantindo que os usuários possam se registrar e acessar a aplicação de forma segura e conveniente.
- **Arquitetura Multi-usuário:** O banco de dados foi projetado para isolar completamente os dados de cada usuário. Cada transação e categoria está vinculada a um `usuario_id`, garantindo total privacidade.
- **API RESTful Completa (CRUD):** Fornece endpoints para todas as operações essenciais de criação, leitura, atualização e exclusão para:
  - **Transações:** Registro de proventos e despesas com detalhes como valor, data, categoria, data de vencimento e controle de notificações.
  - **Categorias:** Permite que cada usuário crie e gerencie suas próprias categorias de gastos e receitas.
- **Filtragem de Dados:** A API permite a filtragem dinâmica de transações por período (mês e ano).
- **Gerenciamento de Sessão:** Utiliza `express-session` para manter os usuários logados de forma persistente e segura através de cookies.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com as seguintes tecnologias:

| Categoria                 | Tecnologia                                                            |
| :------------------------ | :-------------------------------------------------------------------- |
| **Runtime**               | [Node.js](https://nodejs.org/)                                        |
| **Framework**             | [Express.js](https://expressjs.com/pt-br/)                            |
| **Banco de Dados**        | [PostgreSQL](https://www.postgresql.org/)                             |
| **Autenticação**          | [Passport.js](http://www.passportjs.org/) (`passport-google-oauth20`) |
| **Sessão**                | `express-session`                                                     |
| **Comunicação com DB**    | `node-postgres` (pg)                                                  |
| **Variáveis de Ambiente** | `dotenv`                                                              |
| **CORS**                  | `cors`                                                                |

---

## 📋 Endpoints da API

Abaixo está um resumo dos principais endpoints disponíveis. Todas as rotas de dados são protegidas e requerem autenticação via sessão.

**URL Base:** `http://localhost:3000`

### Autenticação

| Método | Endpoint                | Descrição                                                |
| :----- | :---------------------- | :------------------------------------------------------- |
| `GET`  | `/auth/google`          | Inicia o fluxo de login com o Google.                    |
| `GET`  | `/auth/google/callback` | Rota de callback que o Google chama após o login.        |
| `GET`  | `/auth/user`            | Verifica e retorna os dados do usuário logado na sessão. |
| `GET`  | `/auth/logout`          | Encerra a sessão do usuário.                             |

### Categorias

| Método   | Endpoint          | Descrição                                      |
| :------- | :---------------- | :--------------------------------------------- |
| `GET`    | `/categorias`     | Lista todas as categorias do usuário logado.   |
| `POST`   | `/categorias`     | Cria uma nova categoria para o usuário logado. |
| `PUT`    | `/categorias/:id` | Atualiza uma categoria existente.              |
| `DELETE` | `/categorias/:id` | Deleta uma categoria.                          |

### Transações

| Método   | Endpoint          | Descrição                                              |
| :------- | :---------------- | :----------------------------------------------------- |
| `GET`    | `/transacoes`     | Lista as transações do usuário, com filtros opcionais. |
| `GET`    | `/transacoes/:id` | Busca uma transação específica pelo seu ID.            |
| `POST`   | `/transacoes`     | Cria uma nova transação.                               |
| `PUT`    | `/transacoes/:id` | Atualiza uma transação existente.                      |
| `DELETE` | `/transacoes/:id` | Deleta uma transação.                                  |

**Parâmetros de Filtro:** `/transacoes?ano=YYYY&mes=MM`

---

## 🔮 Funcionalidades Futuras Planejadas

- [ ] **Sistema de Lembretes:** Implementação de um _cron job_ para verificar transações com `data_vencimento` próxima.
- [ ] **Integração com Google Calendar:** Permitir que os lembretes criem eventos na agenda do usuário.
- [ ] **Notificações Push:** Enviar notificações via navegador para avisos de vencimento.
- [ ] **Relatórios Avançados:** Criação de endpoints específicos para agregar dados e gerar relatórios mais complexos.

---

## ⚙️ Como Executar o Projeto Localmente

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/Williais/ContaSync_Backend.git](https://github.com/Williais/ContaSync_Backend.git)
    ```
2.  **Navegue para a pasta do projeto:**
    ```bash
    cd ContaSync_Backend
    ```
3.  **Instale as dependências:**
    ```bash
    npm install
    ```
4.  **Configure as variáveis de ambiente:**
    - Crie um arquivo `.env` na raiz do projeto.
    - Adicione as seguintes variáveis:
      ```env
      GOOGLE_CLIENT_ID=SEU_ID_DO_CLIENTE_GOOGLE
      GOOGLE_CLIENT_SECRET=SUA_CHAVE_SECRETA_GOOGLE
      SESSION_SECRET=UMA_SENHA_SECRETA_LONGA_E_ALEATORIA
      DATABASE_URL="postgres://SEU_USUARIO:SUA_SENHA@localhost:5432/SEU_BANCO"
      CLIENT_URL="http://localhost:5173"
      ```
5.  **Configure o banco de dados PostgreSQL:**

    - Garanta que você tenha uma instância do PostgreSQL rodando localmente.
    - Execute os scripts SQL do projeto para criar as tabelas `usuarios`, `categorias` e `transacoes`.

6.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    O servidor estará rodando em `http://localhost:3000`.
