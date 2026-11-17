import os
import json
import shutil
import uuid
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import Optional

from database import criar_banco, get_session
from models import Usuario, Projeto, VagaProjeto, MembroEquipe, Candidatura, Mentoria, InscricaoSessao, Mensagem
from auth import gerar_hash_senha, verificar_senha, criar_token_acesso, get_usuario_atual

app = FastAPI(title="Conecta Campus API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def on_startup():
    criar_banco()

def salvar_imagem(arquivo: Optional[UploadFile]) -> Optional[str]:
    if not arquivo or not arquivo.filename:
        return None
    ext = os.path.splitext(arquivo.filename)[1]
    nome_unico = f"{uuid.uuid4().hex}{ext}"
    caminho = os.path.join(UPLOAD_DIR, nome_unico)
    with open(caminho, "wb") as buffer:
        shutil.copyfileobj(arquivo.file, buffer)
    return f"http://127.0.0.1:8000/uploads/{nome_unico}"

# --- SCHEMAS ---
class UsuarioCadastro(BaseModel):
    nome: str
    email: str
    cpf: str
    data_nascimento: str
    senha: str
    curso: str
    papel: str = "ALUNO"

class NovaMensagem(BaseModel):
    texto: str

class NovaVagaInput(BaseModel):
    titulo_vaga: str
    competencias_vaga: str
    quantidade: int = 1

class NovaMentoriaInput(BaseModel):
    tipo: str
    area: str
    horario_disponivel: str
    modalidade: str
    localizacao: Optional[str] = None
    link_reuniao: Optional[str] = None
    capacidade: int = 1

class EditarMentoriaInput(BaseModel):
    tipo: str
    area: str
    horario_disponivel: str
    modalidade: str
    localizacao: Optional[str] = None
    link_reuniao: Optional[str] = None
    capacidade: int = 1
    status: str

# --- 1. AUTENTICAÇÃO E PERFIL ---

@app.post("/cadastro")
def cadastrar_usuario(dados: UsuarioCadastro, session: Session = Depends(get_session)):
    cpf_limpo = "".join(filter(str.isdigit, dados.cpf))
    if len(cpf_limpo) != 11:
        raise HTTPException(status_code=400, detail="CPF inválido. Informe os 11 dígitos.")
    if len(dados.data_nascimento.strip()) < 8:
        raise HTTPException(status_code=400, detail="Informe uma data de nascimento válida (DD/MM/AAAA).")
    if session.exec(select(Usuario).where(Usuario.email == dados.email)).first():
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")
    if session.exec(select(Usuario).where(Usuario.cpf == cpf_limpo)).first():
        raise HTTPException(status_code=400, detail="Já existe uma conta cadastrada com este CPF.")

    novo = Usuario(
        nome=dados.nome, email=dados.email, cpf=cpf_limpo,
        data_nascimento=dados.data_nascimento, senha_hash=gerar_hash_senha(dados.senha),
        curso=dados.curso, papel=dados.papel.upper()
    )
    session.add(novo)
    session.commit()
    session.refresh(novo)
    return {"mensagem": "Conta criada com sucesso!", "id": novo.id}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    usuario = session.exec(select(Usuario).where(Usuario.email == form_data.username)).first()
    if not usuario or not verificar_senha(form_data.password, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    token = criar_token_acesso(dados={"sub": usuario.email})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/perfil")
def ver_meu_perfil(usuario: Usuario = Depends(get_usuario_atual)):
    return {
        "id": usuario.id, "nome": usuario.nome, "email": usuario.email,
        "cpf": usuario.cpf, "data_nascimento": usuario.data_nascimento,
        "curso": usuario.curso, "papel": usuario.papel, "foto_url": usuario.foto_url,
        "bio": usuario.bio, "competencias": usuario.competencias,
        "linkedin_url": usuario.linkedin_url, "perfil_progresso": usuario.perfil_progresso
    }

@app.put("/perfil")
def atualizar_perfil(
    nome: str = Form(...), curso: str = Form(...), data_nascimento: str = Form(...),
    bio: str = Form(""), competencias: str = Form(""), linkedin_url: str = Form(""),
    foto: Optional[UploadFile] = File(None),
    usuario: Usuario = Depends(get_usuario_atual), session: Session = Depends(get_session)
):
    usuario.nome = nome
    usuario.curso = curso
    usuario.data_nascimento = data_nascimento
    usuario.bio = bio
    usuario.competencias = competencias
    usuario.linkedin_url = linkedin_url
    url_foto = salvar_imagem(foto)
    if url_foto:
        usuario.foto_url = url_foto
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    return {"mensagem": "Perfil atualizado com sucesso!", "novo_progresso": usuario.perfil_progresso}

# --- 2. PROJETOS, MODALIDADE, VAGAS E ENTREGA FINAL ---

@app.get("/projetos")
def listar_projetos(categoria: Optional[str] = None, session: Session = Depends(get_session)):
    query = select(Projeto)
    if categoria and categoria != "Todas":
        query = query.where(Projeto.categoria == categoria)
    projetos = session.exec(query).all()

    resultado = []
    for p in projetos:
        membros = session.exec(select(MembroEquipe).where(MembroEquipe.projeto_id == p.id)).all()
        vagas = session.exec(select(VagaProjeto).where(VagaProjeto.projeto_id == p.id)).all()
        resultado.append({
            **p.model_dump(),
            "membros": [m.model_dump() for m in membros],
            "vagas": [v.model_dump() for v in vagas]
        })
    return resultado

@app.post("/projetos")
def criar_projeto(
    titulo: str = Form(...),
    categoria: str = Form(...),
    modalidade: str = Form("PRESENCIAL"),
    localizacao: str = Form(""),
    link_reuniao: str = Form(""),
    descricao: str = Form(...),
    tags: str = Form(...),
    vagas_json: str = Form(...),
    foto: Optional[UploadFile] = File(None),
    usuario: Usuario = Depends(get_usuario_atual),
    session: Session = Depends(get_session)
):
    url_foto = salvar_imagem(foto)
    novo = Projeto(
        titulo=titulo, categoria=categoria, modalidade=modalidade.upper(),
        localizacao=localizacao or None, link_reuniao=link_reuniao or None,
        descricao=descricao, tags=tags, foto_url=url_foto,
        criador_id=usuario.id, criador_nome=usuario.nome,
        orientador_nome=f"Prof. {usuario.nome}" if usuario.papel == "PROFESSOR" else None
    )
    session.add(novo)
    session.commit()
    session.refresh(novo)

    lista_vagas = json.loads(vagas_json)
    for v in lista_vagas:
        nova_vaga = VagaProjeto(
            projeto_id=novo.id,
            titulo_vaga=v["titulo_vaga"],
            competencias_vaga=v["competencias_vaga"],
            quantidade=int(v.get("quantidade", 1))
        )
        session.add(nova_vaga)

    lider = MembroEquipe(projeto_id=novo.id, usuario_id=usuario.id, usuario_nome=usuario.nome, funcao="Líder / Criador")
    session.add(lider)
    session.commit()
    return {"mensagem": "Projeto publicado com sucesso!", "id": novo.id}

@app.put("/projetos/{projeto_id}")
def editar_projeto(
    projeto_id: int,
    titulo: str = Form(...),
    categoria: str = Form(...),
    status: str = Form(...),
    modalidade: str = Form(...),
    localizacao: str = Form(""),
    link_reuniao: str = Form(""),
    link_entrega: str = Form(""),
    descricao: str = Form(...),
    tags: str = Form(...),
    foto: Optional[UploadFile] = File(None),
    usuario: Usuario = Depends(get_usuario_atual),
    session: Session = Depends(get_session)
):
    projeto = session.get(Projeto, projeto_id)
    if not projeto or projeto.criador_id != usuario.id:
        raise HTTPException(status_code=403, detail="Sem permissão.")

    projeto.titulo = titulo
    projeto.categoria = categoria
    projeto.status = status
    projeto.modalidade = modalidade.upper()
    projeto.localizacao = localizacao or None
    projeto.link_reuniao = link_reuniao or None
    projeto.link_entrega = link_entrega or None
    projeto.descricao = descricao
    projeto.tags = tags
    url_foto = salvar_imagem(foto)
    if url_foto:
        projeto.foto_url = url_foto

    session.add(projeto)
    session.commit()
    return {"mensagem": "Configurações do projeto salvas!"}

@app.post("/projetos/{projeto_id}/vagas")
def adicionar_vaga_projeto(
    projeto_id: int, dados: NovaVagaInput,
    usuario: Usuario = Depends(get_usuario_atual), session: Session = Depends(get_session)
):
    projeto = session.get(Projeto, projeto_id)
    if not projeto or projeto.criador_id != usuario.id:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    nova_vaga = VagaProjeto(
        projeto_id=projeto_id, titulo_vaga=dados.titulo_vaga,
        competencias_vaga=dados.competencias_vaga, quantidade=dados.quantidade
    )
    session.add(nova_vaga)
    session.commit()
    return {"mensagem": "Nova vaga adicionada ao projeto!"}

@app.delete("/vagas/{vaga_id}")
def remover_vaga(vaga_id: int, usuario: Usuario = Depends(get_usuario_atual), session: Session = Depends(get_session)):
    vaga = session.get(VagaProjeto, vaga_id)
    projeto = session.get(Projeto, vaga.projeto_id)
    if projeto.criador_id != usuario.id:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    session.delete(vaga)
    session.commit()
    return {"mensagem": "Vaga removida."}

@app.post("/projetos/{projeto_id}/orientar")
def apadrinhar_projeto(projeto_id: int, usuario: Usuario = Depends(get_usuario_atual), session: Session = Depends(get_session)):
    if usuario.papel != "PROFESSOR":
        raise HTTPException(status_code=403, detail="Apenas professores podem assumir orientação.")
    projeto = session.get(Projeto, projeto_id)
    projeto.orientador_nome = f"Prof. {usuario.nome}"
    session.add(projeto)
    session.commit()
    return {"mensagem": f"Você agora orienta o projeto {projeto.titulo}!"}

# --- 3. CANDIDATURA POR VAGA E CHAT ---

@app.post("/vagas/{vaga_id}/candidatar")
def candidatar_vaga(vaga_id: int, usuario: Usuario = Depends(get_usuario_atual), session: Session = Depends(get_session)):
    if usuario.papel == "VISITANTE":
        raise HTTPException(status_code=403, detail="Visitantes não podem se candidatar.")
    vaga = session.get(VagaProjeto, vaga_id)
    projeto = session.get(Projeto, vaga.projeto_id)
    if projeto.criador_id == usuario.id:
        raise HTTPException(status_code=400, detail="Você já é o líder deste projeto.")
    if vaga.quantidade <= 0 or projeto.status != "ABERTO":
        raise HTTPException(status_code=400, detail="Esta vaga não está mais disponível.")

    ja_candidatou = session.exec(
        select(Candidatura).where(Candidatura.vaga_id == vaga_id, Candidatura.usuario_id == usuario.id)
    ).first()
    if ja_candidatou:
        raise HTTPException(status_code=400, detail="Você já se candidatou para esta vaga.")

    nova = Candidatura(
        projeto_id=projeto.id, projeto_titulo=projeto.titulo,
        vaga_id=vaga.id, vaga_titulo=vaga.titulo_vaga,
        usuario_id=usuario.id, usuario_nome=usuario.nome, usuario_curso=usuario.curso
    )
    session.add(nova)
    session.commit()
    session.refresh(nova)

    msg = Mensagem(
        candidatura_id=nova.id, remetente_id=usuario.id, remetente_nome=usuario.nome,
        texto=f"Olá! Me candidatei para a vaga de {vaga.titulo_vaga} ({vaga.competencias_vaga}) no projeto {projeto.titulo}."
    )
    session.add(msg)
    session.commit()
    return {"mensagem": f"Candidatura enviada para {vaga.titulo_vaga}!"}

@app.get("/minhas-conversas")
def listar_conversas(usuario: Usuario = Depends(get_usuario_atual), session: Session = Depends(get_session)):
    meus_projetos = session.exec(select(Projeto).where(Projeto.criador_id == usuario.id)).all()
    meus_ids = [p.id for p in meus_projetos]

    todas = session.exec(select(Candidatura)).all()
    resultado = []
    for c in todas:
        eh_dono = c.projeto_id in meus_ids
        eh_candidato = c.usuario_id == usuario.id
        if eh_dono or eh_candidato:
            resultado.append({
                "id": c.id, "projeto_id": c.projeto_id, "projeto_titulo": c.projeto_titulo,
                "vaga_titulo": c.vaga_titulo, "candidato_nome": c.usuario_nome,
                "candidato_curso": c.usuario_curso, "status": c.status, "sou_dono_projeto": eh_dono
            })
    return resultado

@app.patch("/candidaturas/{candidatura_id}/responder")
def responder_candidatura(
    candidatura_id: int, aceitar: bool,
    usuario: Usuario = Depends(get_usuario_atual), session: Session = Depends(get_session)
):
    candidatura = session.get(Candidatura, candidatura_id)
    projeto = session.get(Projeto, candidatura.projeto_id)
    vaga = session.get(VagaProjeto, candidatura.vaga_id)
    if projeto.criador_id != usuario.id:
        raise HTTPException(status_code=403, detail="Sem permissão.")

    if aceitar:
        if vaga and vaga.quantidade <= 0:
            raise HTTPException(status_code=400, detail="Não há mais posições abertas nessa vaga.")
        candidatura.status = "ACEITO"
        if vaga:
            vaga.quantidade -= 1
            session.add(vaga)

        novo_membro = MembroEquipe(
            projeto_id=projeto.id, usuario_id=candidatura.usuario_id,
            usuario_nome=candidatura.usuario_nome, funcao=candidatura.vaga_titulo
        )
        session.add(novo_membro)
        aviso = f"✅ {usuario.nome} aceitou {candidatura.usuario_nome} como {candidatura.vaga_titulo}!"
    else:
        candidatura.status = "RECUSADO"
        aviso = f"Candidatura para {candidatura.vaga_titulo} encerrada por {usuario.nome}."

    session.add(candidatura)
    session.add(Mensagem(candidatura_id=candidatura.id, remetente_id=usuario.id, remetente_nome=usuario.nome, texto=aviso))
    session.commit()
    return {"status": candidatura.status}

@app.get("/candidaturas/{candidatura_id}/mensagens")
def listar_mensagens(candidatura_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Mensagem).where(Mensagem.candidatura_id == candidatura_id)).all()

@app.post("/candidaturas/{candidatura_id}/mensagens")
def enviar_mensagem(candidatura_id: int, dados: NovaMensagem, usuario: Usuario = Depends(get_usuario_atual), session: Session = Depends(get_session)):
    nova = Mensagem(candidatura_id=candidatura_id, remetente_id=usuario.id, remetente_nome=usuario.nome, texto=dados.texto)
    session.add(nova)
    session.commit()
    session.refresh(nova)
    return nova

# --- 4. MENTORIAS, PALESTRAS, LOTAÇÃO E CHECK-IN DE PRESENÇA ---

@app.get("/mentorias")
def listar_mentorias(session: Session = Depends(get_session)):
    sessoes = session.exec(select(Mentoria)).all()
    resultado = []
    for m in sessoes:
        inscritos = session.exec(select(InscricaoSessao).where(InscricaoSessao.mentoria_id == m.id)).all()
        resultado.append({
            **m.model_dump(),
            "inscritos": [i.model_dump() for i in inscritos]
        })
    return resultado

@app.post("/mentorias")
def cadastrar_mentoria(dados: NovaMentoriaInput, usuario: Usuario = Depends(get_usuario_atual), session: Session = Depends(get_session)):
    if usuario.papel == "VISITANTE":
        raise HTTPException(status_code=403, detail="Visitantes não podem criar sessões.")
    prefixo = "Prof." if usuario.papel == "PROFESSOR" else "Aluno"
    cap = 1 if dados.tipo == "Mentoria" else max(1, dados.capacidade)
    nova = Mentoria(
        tipo=dados.tipo, status="AGENDADA",
        modalidade=dados.modalidade.upper(),
        localizacao=dados.localizacao or None,
        link_reuniao=dados.link_reuniao or None,
        capacidade=cap,
        mentor_id=usuario.id, mentor_nome=usuario.nome,
        mentor_cargo=f"{prefixo} · {usuario.curso}",
        area=dados.area, horario_disponivel=dados.horario_disponivel
    )
    session.add(nova)
    session.commit()
    session.refresh(nova)
    return {"mensagem": f"{dados.tipo} publicada com sucesso!", "id": nova.id}

@app.put("/mentorias/{mentoria_id}")
def editar_ou_adiar_mentoria(
    mentoria_id: int, dados: EditarMentoriaInput,
    usuario: Usuario = Depends(get_usuario_atual), session: Session = Depends(get_session)
):
    mentoria = session.get(Mentoria, mentoria_id)
    if not mentoria or mentoria.mentor_id != usuario.id:
        raise HTTPException(status_code=403, detail="Apenas o criador pode gerenciar esta sessão.")

    mentoria.tipo = dados.tipo
    mentoria.area = dados.area
    mentoria.horario_disponivel = dados.horario_disponivel
    mentoria.modalidade = dados.modalidade.upper()
    mentoria.localizacao = dados.localizacao or None
    mentoria.link_reuniao = dados.link_reuniao or None
    mentoria.capacidade = 1 if dados.tipo == "Mentoria" else max(1, dados.capacidade)
    mentoria.status = dados.status
    session.add(mentoria)
    session.commit()
    return {"mensagem": f"Sessão atualizada ({dados.status})!"}

@app.post("/mentorias/{mentoria_id}/agendar")
def agendar_mentoria(mentoria_id: int, usuario: Usuario = Depends(get_usuario_atual), session: Session = Depends(get_session)):
    mentoria = session.get(Mentoria, mentoria_id)
    if mentoria.status == "CANCELADA":
        raise HTTPException(status_code=400, detail="Esta sessão foi cancelada pelo ministrante.")
    if mentoria.mentor_id == usuario.id:
        raise HTTPException(status_code=400, detail="Você é o ministrante desta sessão.")

    inscritos = session.exec(select(InscricaoSessao).where(InscricaoSessao.mentoria_id == mentoria_id)).all()
    if any(i.usuario_id == usuario.id for i in inscritos):
        raise HTTPException(status_code=400, detail="Você já está inscrito nesta sessão.")
    if len(inscritos) >= mentoria.capacidade:
        raise HTTPException(status_code=400, detail="Todas as vagas desta sessão já foram preenchidas.")

    nova_inscricao = InscricaoSessao(
        mentoria_id=mentoria_id,
        usuario_id=usuario.id,
        usuario_nome=usuario.nome,
        usuario_curso=usuario.curso
    )
    session.add(nova_inscricao)
    session.commit()
    return {"mensagem": f"Inscrição confirmada em {mentoria.tipo}: {mentoria.area}!"}

@app.patch("/inscricoes/{inscricao_id}/presenca")
def confirmar_presenca_inscrito(
    inscricao_id: int, presente: bool,
    usuario: Usuario = Depends(get_usuario_atual), session: Session = Depends(get_session)
):
    inscricao = session.get(InscricaoSessao, inscricao_id)
    if not inscricao:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada.")
    mentoria = session.get(Mentoria, inscricao.mentoria_id)
    if mentoria.mentor_id != usuario.id:
        raise HTTPException(status_code=403, detail="Apenas o ministrante pode validar presença.")

    inscricao.presente = presente
    session.add(inscricao)
    session.commit()
    return {"mensagem": "Presença validada para horas complementares!" if presente else "Presença desmarcada."}