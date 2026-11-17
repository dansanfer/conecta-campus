from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    email: str = Field(unique=True, index=True)
    cpf: str = Field(unique=True, index=True)
    data_nascimento: str
    senha_hash: str
    curso: str
    papel: str = "ALUNO"  # ALUNO, PROFESSOR, VISITANTE
    foto_url: Optional[str] = None
    bio: Optional[str] = None
    competencias: Optional[str] = None
    linkedin_url: Optional[str] = None

    @property
    def perfil_progresso(self) -> int:
        campos = [self.nome, self.cpf, self.data_nascimento, self.curso, self.foto_url, self.bio, self.competencias, self.linkedin_url]
        preenchidos = sum(1 for c in campos if c and str(c).strip())
        return int((preenchidos / len(campos)) * 100)

class Projeto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    titulo: str
    categoria: str
    status: str = "ABERTO"          # ABERTO, EM_ANDAMENTO, CONCLUIDO, CANCELADO
    modalidade: str = "PRESENCIAL"  # PRESENCIAL, SEMIPRESENCIAL, REMOTO
    localizacao: Optional[str] = None
    link_reuniao: Optional[str] = None
    link_entrega: Optional[str] = None
    descricao: str
    tags: str
    foto_url: Optional[str] = None
    criador_id: int = Field(foreign_key="usuario.id")
    criador_nome: str
    orientador_nome: Optional[str] = None

class VagaProjeto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    projeto_id: int = Field(foreign_key="projeto.id")
    titulo_vaga: str
    competencias_vaga: str
    quantidade: int = 1

class MembroEquipe(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    projeto_id: int = Field(foreign_key="projeto.id")
    usuario_id: int = Field(foreign_key="usuario.id")
    usuario_nome: str
    funcao: str
    entrou_em: str = Field(default_factory=lambda: datetime.now().strftime("%d/%m/%Y"))

class Candidatura(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    projeto_id: int = Field(foreign_key="projeto.id")
    projeto_titulo: str
    vaga_id: int = Field(foreign_key="vagaprojeto.id")
    vaga_titulo: str
    usuario_id: int = Field(foreign_key="usuario.id")
    usuario_nome: str
    usuario_curso: str
    status: str = "PENDENTE"

class Mentoria(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    tipo: str = "Mentoria"          # Mentoria, Palestra, Workshop
    status: str = "AGENDADA"        # AGENDADA, ADIADA, CANCELADA
    modalidade: str = "PRESENCIAL"  # PRESENCIAL, SEMIPRESENCIAL, REMOTO
    localizacao: Optional[str] = None
    link_reuniao: Optional[str] = None
    capacidade: int = 1
    mentor_id: int = Field(foreign_key="usuario.id")
    mentor_nome: str
    mentor_cargo: str
    area: str
    horario_disponivel: str

class InscricaoSessao(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    mentoria_id: int = Field(foreign_key="mentoria.id")
    usuario_id: int = Field(foreign_key="usuario.id")
    usuario_nome: str
    usuario_curso: str
    presente: bool = False

class Mensagem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    candidatura_id: int = Field(foreign_key="candidatura.id")
    remetente_id: int = Field(foreign_key="usuario.id")
    remetente_nome: str
    texto: str
    enviada_em: str = Field(default_factory=lambda: datetime.now().strftime("%H:%M"))