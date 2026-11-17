<div align="center">

# Conecta Campus

**Ecossistema acadêmico para formação de equipes multidisciplinares, mentoria entre pares e validação de atividades extracurriculares.**

[![Python](https://img.shields.io/badge/Python-3.12+-173F32?style=for-the-badge&logo=python&logoColor=E4FF73)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-REST_API-173F32?style=for-the-badge&logo=fastapi&logoColor=E4FF73)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-TypeScript-173F32?style=for-the-badge&logo=react&logoColor=E4FF73)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-173F32?style=for-the-badge&logo=tailwindcss&logoColor=E4FF73)](https://tailwindcss.com)
[![SQLModel](https://img.shields.io/badge/SQLModel-ORM-173F32?style=for-the-badge&logo=sqlite&logoColor=E4FF73)](https://sqlmodel.tiangolo.com)

</div>

---

## O Problema & A Solução

No ambiente universitário, ideias de Trabalho de Conclusão de Curso (TCC), extensão e pesquisa frequentemente estagnam pelo isolamento entre cursos — estudantes de Tecnologia precisam de designers ou pesquisadores da área da Saúde, mas não há um canal institucional estruturado para conectar esses perfis.

O **Conecta Campus** resolve esse gargalo centralizando:

1. **Recrutamento Técnico por Vaga:** Projetos publicam posições específicas com stack/competências exigidas, permitindo candidaturas direcionadas e formação oficial de equipe.
2. **Canal de Negociação Integrado:** Cada candidatura abre automaticamente uma sala de chat privada entre o líder do projeto e o interessado antes da efetivação na equipe.
3. **Eventos Acadêmicos com Check-in:** Alunos veteranos e docentes ofertam mentorias, palestras e workshops (presenciais, semipresenciais ou remotos) com controle de lotação e validação de presença para horas complementares.

---

## Arquitetura & Modelagem de Dados

A aplicação opera de forma desacoplada: uma API RESTful em **Python (FastAPI)** responsável pelas regras de integridade, autenticação JWT e persistência relacional, consumida por uma interface responsiva em **React + TypeScript**.

```mermaid
erDiagram
    USUARIO ||--o{ PROJETO : "lidera"
    USUARIO ||--o{ CANDIDATURA : "envia"
    USUARIO ||--o{ MEMBRO_EQUIPE : "integra"
    USUARIO ||--o{ MENTORIA : "ministra"
    USUARIO ||--o{ INSCRICAO_SESSAO : "participa"
    PROJETO ||--|{ VAGA_PROJETO : "disponibiliza"
    PROJETO ||--o{ MEMBRO_EQUIPE : "compoe"
    VAGA_PROJETO ||--o{ CANDIDATURA : "recebe"
    CANDIDATURA ||--|{ MENSAGEM : "possui_chat"
    MENTORIA ||--o{ INSCRICAO_SESSAO : "controla_presenca"

    Controle de Acesso Baseado em Papéis (RBAC)PerfilPermissões EspecíficasRestrições de IntegridadeALUNOCria projetos, abre vagas por competência, candidata-se, oferece palestras/workshops e utiliza o chat.Impedido de se candidatar ao próprio projeto ou duplicar candidaturas na mesma vaga.PROFESSORTodas as atribuições de criação + botão exclusivo para Apadrinhar/Orientar Projetos (selo institucional).Apenas o docente responsável valida presença nas próprias sessões.VISITANTEExplora a vitrine pública de projetos concluídos e equipes em formação.Bloqueado de candidaturas internas e abertura de sessões acadêmicas.Regras de Negócio & FuncionalidadesUnicidade Cadastral (CPF & E-mail): Validação rigorosa no back-end e restrição UNIQUE no banco impedindo múltiplas contas vinculadas ao mesmo CPF.Gestão de Ciclo de Vida: Projetos transitam entre ABERTO, EM_ANDAMENTO, CONCLUIDO (liberando vitrine de repositório/entregável final) e CANCELADO.Eventos & Check-in: Palestras e workshops contam com limite de vagas, reagendamento (ADIADA), cancelamento e validação individual de presença pelo ministrante.Modalidade Condicional: Suporte nativo a dinâmicas PRESENCIAL, SEMIPRESENCIAL e REMOTO, adaptando dinamicamente os campos de sala física e link de transmissão.Estrutura do Projeto

    conecta-campus/
├── backend/
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api.ts
│   │   ├── App.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md

Como Executar Localmente
1. Clonar o repositório

git clone [https://github.com/SEU-USUARIO/conecta-campus.git](https://github.com/SEU-USUARIO/conecta-campus.git)
cd conecta-campus

2. Iniciar o Back-end (Python / FastAPI)

cd backend
python -m venv venv

# Ativar ambiente virtual no Windows:
.\venv\Scripts\activate

# Ativar ambiente virtual no Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload

cd backend
python -m venv venv

# Ativar ambiente virtual no Windows:
.\venv\Scripts\activate

# Ativar ambiente virtual no Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload

3. Iniciar o Front-end (React / Vite)
Em um novo terminal, a partir da raiz do projeto:

cd frontend
npm install
npm run dev

Principais Endpoints da APIMétodoRotaDescriçãoAutenticaçãoPOST/cadastroRegistro de usuário com validação de CPF único e papel (RBAC).PúblicaPOST/loginAutenticação OAuth2 Password Flow com emissão de token JWT.PúblicaGET / PUT/perfilLeitura, cálculo automático de completude e upload de avatar.Bearer JWTGET / POST/projetosListagem com filtros e criação de projeto com vagas detalhadas.Bearer JWTPOST/vagas/{id}/candidatarRegistra interesse na vaga e inicializa sala de chat privada.Bearer JWTPATCH/candidaturas/{id}/responderAceita candidato (efetivando na tabela MembroEquipe) ou recusa.LíderPOST/mentoriasPublica mentoria, palestra ou workshop com controle de lotação.Docente/AlunoPATCH/inscricoes/{id}/presencaValida presença do aluno para horas complementares.Ministrante

Aqui está o `README.md` pronto para você copiar e colar direto no seu editor (ou na interface web do GitHub), sem nenhum bloco quebrado e com toda a formatação de tabelas, diagrama e badges funcionando perfeitamente.

Para copiar sem erro, basta clicar no ícone de **copiar** no canto superior direito do bloco de código abaixo, colar no seu arquivo `README.md`, salvar e enviar com `git add README.md`, `git commit -m "docs: atualiza README"` e `git push`.

```markdown
<div align="center">

# Conecta Campus

**Ecossistema acadêmico para formação de equipes multidisciplinares, mentoria entre pares e validação de atividades extracurriculares.**

[![Python](https://img.shields.io/badge/Python-3.12+-173F32?style=for-the-badge&logo=python&logoColor=E4FF73)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-REST_API-173F32?style=for-the-badge&logo=fastapi&logoColor=E4FF73)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-TypeScript-173F32?style=for-the-badge&logo=react&logoColor=E4FF73)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-173F32?style=for-the-badge&logo=tailwindcss&logoColor=E4FF73)](https://tailwindcss.com)
[![SQLModel](https://img.shields.io/badge/SQLModel-ORM-173F32?style=for-the-badge&logo=sqlite&logoColor=E4FF73)](https://sqlmodel.tiangolo.com)

</div>

---

## O Problema & A Solução

No ambiente universitário, ideias de Trabalho de Conclusão de Curso (TCC), extensão e pesquisa frequentemente estagnam pelo isolamento entre cursos — estudantes de Tecnologia precisam de designers ou pesquisadores da área da Saúde, mas não há um canal institucional estruturado para conectar esses perfis.

O **Conecta Campus** resolve esse gargalo centralizando:

1. **Recrutamento Técnico por Vaga:** Projetos publicam posições específicas com stack/competências exigidas, permitindo candidaturas direcionadas e formação oficial de equipe.
2. **Canal de Negociação Integrado:** Cada candidatura abre automaticamente uma sala de chat privada entre o líder do projeto e o interessado antes da efetivação na equipe.
3. **Eventos Acadêmicos com Check-in:** Alunos veteranos e docentes ofertam mentorias, palestras e workshops (presenciais, semipresenciais ou remotos) com controle de lotação e validação de presença para horas complementares.

---

## Arquitetura & Modelagem de Dados

A aplicação opera de forma desacoplada: uma API RESTful em **Python (FastAPI)** responsável pelas regras de integridade, autenticação JWT e persistência relacional, consumida por uma interface responsiva em **React + TypeScript**.

```mermaid
erDiagram
    USUARIO ||--o{ PROJETO : "lidera"
    USUARIO ||--o{ CANDIDATURA : "envia"
    USUARIO ||--o{ MEMBRO_EQUIPE : "integra"
    USUARIO ||--o{ MENTORIA : "ministra"
    USUARIO ||--o{ INSCRICAO_SESSAO : "participa"
    PROJETO ||--|{ VAGA_PROJETO : "disponibiliza"
    PROJETO ||--o{ MEMBRO_EQUIPE : "compoe"
    VAGA_PROJETO ||--o{ CANDIDATURA : "recebe"
    CANDIDATURA ||--|{ MENSAGEM : "possui_chat"
    MENTORIA ||--o{ INSCRICAO_SESSAO : "controla_presenca"

```

---

## Controle de Acesso Baseado em Papéis (RBAC)

| Perfil | Permissões Específicas | Restrições de Integridade |
| --- | --- | --- |
| **`ALUNO`** | Cria projetos, abre vagas por competência, candidata-se, oferece palestras/workshops e utiliza o chat. | Impedido de se candidatar ao próprio projeto ou duplicar candidaturas na mesma vaga. |
| **`PROFESSOR`** | Todas as atribuições de criação + botão exclusivo para **Apadrinhar/Orientar Projetos** (selo institucional). | Apenas o docente responsável valida presença nas próprias sessões. |
| **`VISITANTE`** | Explora a vitrine pública de projetos concluídos e equipes em formação. | Bloqueado de candidaturas internas e abertura de sessões acadêmicas. |

---

## Regras de Negócio & Funcionalidades

* **Unicidade Cadastral (CPF & E-mail):** Validação rigorosa no back-end e restrição `UNIQUE` no banco impedindo múltiplas contas vinculadas ao mesmo CPF.
* **Gestão de Ciclo de Vida:** Projetos transitam entre `ABERTO`, `EM_ANDAMENTO`, `CONCLUIDO` (liberando vitrine de repositório/entregável final) e `CANCELADO`.
* **Eventos & Check-in:** Palestras e workshops contam com limite de vagas, reagendamento (`ADIADA`), cancelamento e validação individual de presença pelo ministrante.
* **Modalidade Condicional:** Suporte nativo a dinâmicas `PRESENCIAL`, `SEMIPRESENCIAL` e `REMOTO`, adaptando dinamicamente os campos de sala física e link de transmissão.

---

## Estrutura do Projeto

```text
conecta-campus/
├── backend/
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api.ts
│   │   ├── App.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md

```

---

## Como Executar Localmente

### 1. Clonar o repositório

```bash
git clone [https://github.com/SEU-USUARIO/conecta-campus.git](https://github.com/SEU-USUARIO/conecta-campus.git)
cd conecta-campus

```

### 2. Iniciar o Back-end (Python / FastAPI)

```bash
cd backend
python -m venv venv

# Ativar ambiente virtual no Windows:
.\venv\Scripts\activate

# Ativar ambiente virtual no Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload

```

> A API estará disponível em `http://127.0.0.1:8000` e a documentação interativa Swagger em `http://127.0.0.1:8000/docs`.

### 3. Iniciar o Front-end (React / Vite)

Em um novo terminal, a partir da raiz do projeto:

```bash
cd frontend
npm install
npm run dev

```

> Acesse a interface web em `http://localhost:5173`.

---

## Principais Endpoints da API

| Método | Rota | Descrição | Autenticação |
| --- | --- | --- | --- |
| `POST` | `/cadastro` | Registro de usuário com validação de CPF único e papel (`RBAC`). | Pública |
| `POST` | `/login` | Autenticação OAuth2 Password Flow com emissão de token `JWT`. | Pública |
| `GET` / `PUT` | `/perfil` | Leitura, cálculo automático de completude e upload de avatar. | Bearer JWT |
| `GET` / `POST` | `/projetos` | Listagem com filtros e criação de projeto com vagas detalhadas. | Bearer JWT |
| `POST` | `/vagas/{id}/candidatar` | Registra interesse na vaga e inicializa sala de chat privada. | Bearer JWT |
| `PATCH` | `/candidaturas/{id}/responder` | Aceita candidato (efetivando na tabela `MembroEquipe`) ou recusa. | Líder |
| `POST` | `/mentorias` | Publica mentoria, palestra ou workshop com controle de lotação. | Docente/Aluno |
| `PATCH` | `/inscricoes/{id}/presenca` | Valida presença do aluno para horas complementares. | Ministrante |

```

<FollowUp label="Quer iniciar agora a ramificação do StudySpace em Flutter e Python?" query="Sim, vamos iniciar a estruturação e o desenvolvimento do StudySpace em Flutter com back-end em Python."/>

```