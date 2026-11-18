<div align="center">

# Conecta Campus

**Ecossistema academico para formacao de equipes multidisciplinares, mentoria entre pares e validacao de atividades extracurriculares.**

[![Python](https://img.shields.io/badge/Python-3.12+-173F32?style=for-the-badge&logo=python&logoColor=E4FF73)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-REST_API-173F32?style=for-the-badge&logo=fastapi&logoColor=E4FF73)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-TypeScript-173F32?style=for-the-badge&logo=react&logoColor=E4FF73)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-173F32?style=for-the-badge&logo=tailwindcss&logoColor=E4FF73)](https://tailwindcss.com)
[![SQLModel](https://img.shields.io/badge/SQLModel-ORM-173F32?style=for-the-badge&logo=sqlite&logoColor=E4FF73)](https://sqlmodel.tiangolo.com)

</div>

---

## O Problema & A Solucao

No ambiente universitario, ideias de Trabalho de Conclusao de Curso (TCC), extensao e pesquisa frequentemente estagnam pelo isolamento entre cursos — estudantes de Tecnologia precisam de designers ou pesquisadores da area da Saude, mas nao ha um canal institucional estruturado para conectar esses perfis.

O **Conecta Campus** resolve esse gargalo centralizando:

1. **Recrutamento Tecnico por Vaga:** Projetos publicam posicoes especificas com stack e competencias exigidas, permitindo candidaturas direcionadas e formacao oficial de equipe.
2. **Canal de Negociacao Integrado:** Cada candidatura abre automaticamente uma sala de chat privada entre o lider do projeto e o interessado antes da efetivacao na equipe.
3. **Eventos Academicos com Check-in:** Alunos veteranos e docentes ofertam mentorias, palestras e workshops (presenciais, semipresenciais ou remotos) com controle de lotacao e validacao de presenca para horas complementares.

---

## Arquitetura & Fluxo do Sistema

A aplicacao opera de forma desacoplada: uma API RESTful em **Python (FastAPI)** responsavel pelas regras de integridade, autenticacao JWT e persistencia relacional, consumida por uma interface responsiva em **React + TypeScript**.

- **Usuario** cria ou integra **Projetos** e ministra ou participa de **Sessoes Academicas**.
- **Projeto** disponibiliza multiplas **Vagas** com competencias especificas e compoe a tabela oficial de **Membros**.
- **Vaga** recebe **Candidaturas** que abrem uma sala privada de **Mensagens** entre candidato e lider.
- **Mentoria / Palestra** gerencia **Inscricoes** com limite de vagas e validacao individual de presenca.

---

## Controle de Acesso Baseado em Papeis (RBAC)

| Perfil | Permissoes Especificas | Restricoes de Integridade |
| :--- | :--- | :--- |
| **ALUNO** | Cria projetos, abre vagas por competencia, candidata-se, oferece palestras/workshops e utiliza o chat. | Impedido de se candidatar ao proprio projeto ou duplicar candidaturas na mesma vaga. |
| **PROFESSOR** | Todas as atribuicoes de criacao + botao exclusivo para **Apadrinhar/Orientar Projetos** (selo institucional). | Apenas o docente responsavel valida presenca nas proprias sessoes. |
| **VISITANTE** | Explora a vitrine publica de projetos concluidos e equipes em formacao. | Bloqueado de candidaturas internas e abertura de sessoes academicas. |

---

## Regras de Negocio & Funcionalidades

- **Unicidade Cadastral (CPF & E-mail):** Validacao rigorosa no back-end e restricao UNIQUE no banco impedindo multiplas contas vinculadas ao mesmo CPF.
- **Gestao de Ciclo de Vida:** Projetos transitam entre `ABERTO`, `EM_ANDAMENTO`, `CONCLUIDO` (liberando vitrine de repositorio/entregavel final) e `CANCELADO`.
- **Eventos & Check-in:** Palestras e workshops contam com limite de vagas, reagendamento (`ADIADA`), cancelamento e validacao individual de presenca pelo ministrante.
- **Modalidade Condicional:** Suporte nativo a dinamicas `PRESENCIAL`, `SEMIPRESENCIAL` e `REMOTO`, adaptando dinamicamente os campos de sala fisica e link de transmissao.

---

## Como Executar Localmente

**1. Clonar o repositorio**

    git clone https://github.com/dansanfer/conecta-campus.git
    cd conecta-campus

**2. Iniciar o Back-end (Python / FastAPI)**

    cd backend
    python -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload

A API estara disponivel em `http://127.0.0.1:8000` e a documentacao interativa Swagger em `http://127.0.0.1:8000/docs`.

**3. Iniciar o Front-end (React / Vite)**

    cd frontend
    npm install
    npm run dev

Acesse a interface web em `http://localhost:5173`.

---

## Principais Endpoints da API

| Metodo | Rota | Descricao | Autenticacao |
| :--- | :--- | :--- | :---: |
| `POST` | `/cadastro` | Registro de usuario com validacao de CPF unico e papel (`RBAC`). | Publica |
| `POST` | `/login` | Autenticacao OAuth2 Password Flow com emissao de token `JWT`. | Publica |
| `GET` / `PUT` | `/perfil` | Leitura, calculo automatico de completude e upload de avatar. | Bearer JWT |
| `GET` / `POST` | `/projetos` | Listagem com filtros e criacao de projeto com vagas detalhadas. | Bearer JWT |
| `POST` | `/vagas/{id}/candidatar` | Registra interesse na vaga e inicializa sala de chat privada. | Bearer JWT |
| `PATCH` | `/candidaturas/{id}/responder` | Aceita candidato (efetivando na tabela `MembroEquipe`) ou recusa. | Lider |
| `POST` | `/mentorias` | Publica mentoria, palestra ou workshop com controle de lotacao. | Docente/Aluno |
| `PATCH` | `/inscricoes/{id}/presenca` | Valida presenca do aluno para horas complementares. | Ministrante |
