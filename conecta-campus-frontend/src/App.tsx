import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch, clearToken, getToken, setToken } from './api'

interface CursoItem {
  id: number
  nome: string
  area: string
  ativo: boolean
}

interface Usuario {
  id: number
  nome: string
  email: string
  cpf: string
  data_nascimento: string
  curso: string
  papel: 'ALUNO' | 'PROFESSOR' | 'VISITANTE' | 'GESTOR'
  foto_url?: string
  bio?: string
  competencias?: string
  linkedin_url?: string
  perfil_progresso: number
}

interface Vaga {
  id?: number
  titulo_vaga: string
  competencias_vaga: string
  quantidade: number
}

interface Membro {
  id: number
  usuario_nome: string
  funcao: string
}

interface Projeto {
  id: number
  titulo: string
  categoria: string
  status: string
  modalidade: 'PRESENCIAL' | 'SEMIPRESENCIAL' | 'REMOTO'
  localizacao?: string
  link_reuniao?: string
  link_entrega?: string
  descricao: string
  tags: string
  foto_url?: string
  criador_id: number
  criador_nome: string
  orientador_nome?: string
  membros: Membro[]
  vagas: Vaga[]
}

interface Inscrito {
  id: number
  usuario_id: number
  usuario_nome: string
  usuario_curso: string
  presente: boolean
}

interface Mentoria {
  id: number
  tipo: string
  status: string
  modalidade: 'PRESENCIAL' | 'SEMIPRESENCIAL' | 'REMOTO'
  localizacao?: string
  link_reuniao?: string
  capacidade: number
  mentor_id: number
  mentor_nome: string
  mentor_cargo: string
  area: string
  horario_disponivel: string
  inscritos: Inscrito[]
}

interface Conversa {
  id: number
  projeto_id: number
  projeto_titulo: string
  vaga_titulo: string
  candidato_nome: string
  candidato_curso: string
  status: string
  sou_dono_projeto: boolean
}

interface Mensagem {
  id: number
  remetente_id: number
  remetente_nome: string
  texto: string
  enviada_em: string
}

interface ChamadoSuporte {
  id: number
  usuario_nome: string
  usuario_papel: string
  assunto: string
  mensagem: string
  resposta_gestor?: string
  status: string
  criado_em: string
}

interface MetricasGestor {
  total_usuarios: number
  total_alunos: number
  total_professores: number
  total_projetos: number
  projetos_concluidos: number
  total_sessoes: number
  chamados_abertos: number
}

interface ToastState {
  mensagem: string
  tipo: 'sucesso' | 'erro'
}

function formatarDataInput(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 8)
  if (numeros.length <= 2) return numeros
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`
}

function formatarModalidadeLabel(mod: string) {
  if (mod === 'SEMIPRESENCIAL') return 'Semipresencial'
  if (mod === 'REMOTO') return 'Remoto'
  return 'Presencial'
}

export default function App() {
  const [token, setAuthToken] = useState<string | null>(getToken())
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [page, setPage] = useState<'inicio' | 'equipes' | 'mentorias' | 'mensagens' | 'suporte' | 'gestor' | 'perfil'>('inicio')
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  function notificar(mensagem: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    setToast({ mensagem, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  // Cursos vindos do banco de dados
  const [cursosAtivos, setCursosAtivos] = useState<CursoItem[]>([])
  const [todosCursosGestor, setTodosCursosGestor] = useState<CursoItem[]>([])

  // Login / Cadastro
  const [modoCadastro, setModoCadastro] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [curso, setCurso] = useState('')
  const [papel, setPapel] = useState<'ALUNO' | 'PROFESSOR' | 'VISITANTE'>('ALUNO')

  function limparCamposAuth() {
    setEmail(''); setSenha(''); setNome(''); setCpf(''); setDataNascimento(''); setPapel('ALUNO')
    if (cursosAtivos.length > 0) setCurso(cursosAtivos[0].nome)
    else setCurso('')
  }

  // Dados gerais
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [mentorias, setMentorias] = useState<Mentoria[]>([])
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMsg, setNovaMsg] = useState('')

  // Suporte e Gestor
  const [chamados, setChamados] = useState<ChamadoSuporte[]>([])
  const [assuntoSuporte, setAssuntoSuporte] = useState('')
  const [msgSuporte, setMsgSuporte] = useState('')
  const [metricasGestor, setMetricasGestor] = useState<MetricasGestor | null>(null)
  const [novoCursoNome, setNovoCursoNome] = useState('')
  const [novoCursoArea, setNovoCursoArea] = useState('Tecnologia')
  const [respostasChamados, setRespostasChamados] = useState<Record<number, string>>({})

  // Modais
  const [modalNovoProjeto, setModalNovoProjeto] = useState(false)
  const [modalNovaMentoria, setModalNovaMentoria] = useState(false)
  const [projetoGerenciando, setProjetoGerenciando] = useState<Projeto | null>(null)
  const [mentoriaGerenciando, setMentoriaGerenciando] = useState<Mentoria | null>(null)

  // Form Novo Projeto
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('Tecnologia')
  const [novaModalidadeProj, setNovaModalidadeProj] = useState<'PRESENCIAL' | 'SEMIPRESENCIAL' | 'REMOTO'>('PRESENCIAL')
  const [novoLocalProj, setNovoLocalProj] = useState('')
  const [novoLinkProj, setNovoLinkProj] = useState('')
  const [novaDesc, setNovaDesc] = useState('')
  const [novasTags, setNovasTags] = useState('')
  const [fotoProjeto, setFotoProjeto] = useState<File | null>(null)
  const [vagasNovoProjeto, setVagasNovoProjeto] = useState<Vaga[]>([
    { titulo_vaga: '', competencias_vaga: '', quantidade: 1 }
  ])

  // Form Gerenciar Projeto
  const [editProjTitulo, setEditProjTitulo] = useState('')
  const [editProjCategoria, setEditProjCategoria] = useState('')
  const [editProjStatus, setEditProjStatus] = useState('')
  const [editProjModalidade, setEditProjModalidade] = useState<'PRESENCIAL' | 'SEMIPRESENCIAL' | 'REMOTO'>('PRESENCIAL')
  const [editProjLocal, setEditProjLocal] = useState('')
  const [editProjLink, setEditProjLink] = useState('')
  const [editProjEntrega, setEditProjEntrega] = useState('')
  const [editProjDesc, setEditProjDesc] = useState('')
  const [editProjTags, setEditProjTags] = useState('')
  const [editProjFoto, setEditProjFoto] = useState<File | null>(null)
  const [addVagaTitulo, setAddVagaTitulo] = useState('')
  const [addVagaComp, setAddVagaComp] = useState('')
  const [addVagaQtd, setAddVagaQtd] = useState(1)

  // Form Nova Mentoria / Palestra
  const [tipoSessao, setTipoSessao] = useState('Mentoria')
  const [modalidadeSessao, setModalidadeSessao] = useState<'PRESENCIAL' | 'SEMIPRESENCIAL' | 'REMOTO'>('PRESENCIAL')
  const [localSessao, setLocalSessao] = useState('')
  const [linkSessao, setLinkSessao] = useState('')
  const [capacidadeSessao, setCapacidadeSessao] = useState(20)
  const [areaSessao, setAreaSessao] = useState('')
  const [horarioSessao, setHorarioSessao] = useState('')

  // Form Gerenciar Mentoria / Palestra
  const [editMentTipo, setEditMentTipo] = useState('')
  const [editMentModalidade, setEditMentModalidade] = useState<'PRESENCIAL' | 'SEMIPRESENCIAL' | 'REMOTO'>('PRESENCIAL')
  const [editMentLocal, setEditMentLocal] = useState('')
  const [editMentLink, setEditMentLink] = useState('')
  const [editMentCapacidade, setEditMentCapacidade] = useState(1)
  const [editMentArea, setEditMentArea] = useState('')
  const [editMentHorario, setEditMentHorario] = useState('')
  const [editMentStatus, setEditMentStatus] = useState('AGENDADA')

  // Form Edição Perfil + Preview da Foto
  const [editNome, setEditNome] = useState('')
  const [editCurso, setEditCurso] = useState('')
  const [editNascimento, setEditNascimento] = useState('')
  const [bio, setBio] = useState('')
  const [competencias, setCompetencias] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null)
  const [previewFotoPerfil, setPreviewFotoPerfil] = useState<string | null>(null)

  function navegarPara(destino: typeof page) {
    setPage(destino)
    setMenuMobileAberto(false)
  }

  async function carregarCursosPublicos() {
    try {
      const lista: CursoItem[] = await apiFetch('/cursos?apenas_ativos=true')
      setCursosAtivos(lista)
      if (lista.length > 0 && !curso) setCurso(lista[0].nome)
    } catch {
      // ignora se servidor ainda estiver subindo
    }
  }

  useEffect(() => {
    carregarCursosPublicos()
  }, [])

  async function carregarDados() {
    try {
      await carregarCursosPublicos()

      const perfilData: Usuario = await apiFetch('/perfil')
      setUsuario(perfilData)
      setEditNome(perfilData.nome)
      setEditCurso(perfilData.curso)
      setEditNascimento(perfilData.data_nascimento || '')
      setBio(perfilData.bio || '')
      setCompetencias(perfilData.competencias || '')
      setLinkedin(perfilData.linkedin_url || '')

      const projData: Projeto[] = await apiFetch(`/projetos?categoria=${encodeURIComponent(filtroCategoria)}`)
      setProjetos(projData)
      if (projetoGerenciando) {
        setProjetoGerenciando(projData.find(item => item.id === projetoGerenciando.id) || null)
      }

      const mentData: Mentoria[] = await apiFetch('/mentorias')
      setMentorias(mentData)
      if (mentoriaGerenciando) {
        setMentoriaGerenciando(mentData.find(item => item.id === mentoriaGerenciando.id) || null)
      }

      const convData = await apiFetch('/minhas-conversas')
      setConversas(convData)

      const chamadosData = await apiFetch('/suporte')
      setChamados(chamadosData)

      if (perfilData.papel === 'GESTOR') {
        const metData = await apiFetch('/gestor/metricas')
        setMetricasGestor(metData)
        const todosCursos = await apiFetch('/cursos?apenas_ativos=false')
        setTodosCursosGestor(todosCursos)
      }
    } catch (err: any) {
      notificar(`Erro de sessão: ${err.message}`, 'erro')
    }
  }

  useEffect(() => {
    if (token) carregarDados()
  }, [token, filtroCategoria])

  useEffect(() => {
    if (!conversaAtiva) return
    apiFetch(`/candidaturas/${conversaAtiva.id}/mensagens`).then(setMensagens)
  }, [conversaAtiva])

  async function handleAuth(e: FormEvent) {
    e.preventDefault()
    try {
      if (modoCadastro) {
        const cursoFinal = papel === 'VISITANTE' ? curso : (curso || cursosAtivos[0]?.nome || 'Não informado')
        await apiFetch('/cadastro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, cpf, data_nascimento: dataNascimento, senha, curso: cursoFinal, papel }),
        })
        limparCamposAuth()
        setModoCadastro(false)
        notificar('Conta criada com sucesso! Digite seu e-mail e senha para entrar.', 'sucesso')
        return
      }

      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', senha)

      const loginUrl = import.meta.env.DEV ? 'http://127.0.0.1:8000/login' : '/login'
      const res = await fetch(loginUrl, { method: 'POST', body: form })
      if (!res.ok) throw new Error('E-mail ou senha inválidos')
      const data = await res.json()
      limparCamposAuth()
      setToken(data.access_token)
      setAuthToken(data.access_token)
      notificar('Login realizado com sucesso!', 'sucesso')
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  function handleLogout() {
    clearToken()
    limparCamposAuth()
    setAuthToken(null)
    setUsuario(null)
    setConversaAtiva(null)
    setPreviewFotoPerfil(null)
    setPage('inicio')
  }

  function handleSelecionarFotoPerfil(file: File | null) {
    setFotoPerfil(file)
    if (file) {
      setPreviewFotoPerfil(URL.createObjectURL(file))
    } else {
      setPreviewFotoPerfil(null)
    }
  }

  function atualizarCampoVagaNovoProjeto(index: number, campo: keyof Vaga, valor: string | number) {
    const copia = [...vagasNovoProjeto]
    copia[index] = { ...copia[index], [campo]: valor }
    setVagasNovoProjeto(copia)
  }

  async function handleCriarProjeto(e: FormEvent) {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('titulo', novoTitulo)
      formData.append('categoria', novaCategoria)
      formData.append('modalidade', novaModalidadeProj)
      formData.append('localizacao', novoLocalProj)
      formData.append('link_reuniao', novoLinkProj)
      formData.append('descricao', novaDesc)
      formData.append('tags', novasTags)
      formData.append('vagas_json', JSON.stringify(vagasNovoProjeto))
      if (fotoProjeto) formData.append('foto', fotoProjeto)

      await apiFetch('/projetos', { method: 'POST', body: formData })
      setModalNovoProjeto(false)
      setNovoTitulo(''); setNovoLocalProj(''); setNovoLinkProj(''); setNovaDesc(''); setNovasTags(''); setFotoProjeto(null)
      setVagasNovoProjeto([{ titulo_vaga: '', competencias_vaga: '', quantidade: 1 }])
      notificar('Projeto publicado com sucesso!', 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  function abrirGerenciarProjeto(p: Projeto) {
    setProjetoGerenciando(p)
    setEditProjTitulo(p.titulo)
    setEditProjCategoria(p.categoria)
    setEditProjStatus(p.status)
    setEditProjModalidade(p.modalidade)
    setEditProjLocal(p.localizacao || '')
    setEditProjLink(p.link_reuniao || '')
    setEditProjEntrega(p.link_entrega || '')
    setEditProjDesc(p.descricao)
    setEditProjTags(p.tags)
    setEditProjFoto(null)
  }

  async function handleSalvarEdicaoProjeto(e: FormEvent) {
    e.preventDefault()
    if (!projetoGerenciando) return
    try {
      const formData = new FormData()
      formData.append('titulo', editProjTitulo)
      formData.append('categoria', editProjCategoria)
      formData.append('status', editProjStatus)
      formData.append('modalidade', editProjModalidade)
      formData.append('localizacao', editProjLocal)
      formData.append('link_reuniao', editProjLink)
      formData.append('link_entrega', editProjEntrega)
      formData.append('descricao', editProjDesc)
      formData.append('tags', editProjTags)
      if (editProjFoto) formData.append('foto', editProjFoto)

      await apiFetch(`/projetos/${projetoGerenciando.id}`, { method: 'PUT', body: formData })
      notificar('Configurações do projeto salvas!', 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  async function handleAdicionarVagaNoProjeto(e: FormEvent) {
    e.preventDefault()
    if (!projetoGerenciando) return
    try {
      await apiFetch(`/projetos/${projetoGerenciando.id}/vagas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo_vaga: addVagaTitulo, competencias_vaga: addVagaComp, quantidade: addVagaQtd }),
      })
      setAddVagaTitulo(''); setAddVagaComp(''); setAddVagaQtd(1)
      notificar('Nova vaga adicionada ao projeto!', 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  async function handleRemoverVaga(vagaId: number) {
    try {
      await apiFetch(`/vagas/${vagaId}`, { method: 'DELETE' })
      notificar('Vaga removida.', 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  async function handleOrientarProjeto(projetoId: number) {
    try {
      const res = await apiFetch(`/projetos/${projetoId}/orientar`, { method: 'POST' })
      notificar(res.mensagem, 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  async function handleCandidatarVaga(vagaId: number) {
    try {
      const res = await apiFetch(`/vagas/${vagaId}/candidatar`, { method: 'POST' })
      notificar(res.mensagem, 'sucesso')
      carregarDados()
      navegarPara('mensagens')
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  async function handleResponderCandidatura(candidaturaId: number, aceitar: boolean) {
    try {
      await apiFetch(`/candidaturas/${candidaturaId}/responder?aceitar=${aceitar}`, { method: 'PATCH' })
      notificar(aceitar ? 'Membro aceito na equipe!' : 'Candidatura recusada.', 'sucesso')
      carregarDados()
      if (conversaAtiva?.id === candidaturaId) {
        const msgs = await apiFetch(`/candidaturas/${candidaturaId}/mensagens`)
        setMensagens(msgs)
        setConversaAtiva({ ...conversaAtiva, status: aceitar ? 'ACEITO' : 'RECUSADO' })
      }
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  async function handleEnviarMensagem(e: FormEvent) {
    e.preventDefault()
    if (!conversaAtiva || !novaMsg.trim()) return
    await apiFetch(`/candidaturas/${conversaAtiva.id}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: novaMsg }),
    })
    setNovaMsg('')
    const msgs = await apiFetch(`/candidaturas/${conversaAtiva.id}/mensagens`)
    setMensagens(msgs)
  }

  async function handleCriarMentoria(e: FormEvent) {
    e.preventDefault()
    try {
      await apiFetch('/mentorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoSessao,
          area: areaSessao,
          horario_disponivel: horarioSessao,
          modalidade: modalidadeSessao,
          localizacao: localSessao,
          link_reuniao: linkSessao,
          capacidade: tipoSessao === 'Mentoria' ? 1 : capacidadeSessao,
        }),
      })
      setModalNovaMentoria(false)
      setAreaSessao(''); setHorarioSessao(''); setLocalSessao(''); setLinkSessao('')
      notificar('Sessão acadêmica publicada!', 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  function abrirGerenciarMentoria(m: Mentoria) {
    setMentoriaGerenciando(m)
    setEditMentTipo(m.tipo)
    setEditMentModalidade(m.modalidade)
    setEditMentLocal(m.localizacao || '')
    setEditMentLink(m.link_reuniao || '')
    setEditMentCapacidade(m.capacidade)
    setEditMentArea(m.area)
    setEditMentHorario(m.horario_disponivel)
    setEditMentStatus(m.status)
  }

  async function handleSalvarGerenciamentoMentoria(e: FormEvent, statusForcado?: string) {
    e.preventDefault()
    if (!mentoriaGerenciando) return
    try {
      const statusFinal = statusForcado || editMentStatus
      await apiFetch(`/mentorias/${mentoriaGerenciando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: editMentTipo,
          area: editMentArea,
          horario_disponivel: editMentHorario,
          modalidade: editMentModalidade,
          localizacao: editMentLocal,
          link_reuniao: editMentLink,
          capacidade: editMentTipo === 'Mentoria' ? 1 : editMentCapacidade,
          status: statusFinal,
        }),
      })
      setMentoriaGerenciando(null)
      notificar(
        statusFinal === 'CANCELADA' ? 'Sessão cancelada.' :
        statusFinal === 'ADIADA' ? 'Sessão adiada e remarcada!' : 'Sessão atualizada!',
        'sucesso'
      )
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  async function handleAgendarMentoria(mentoriaId: number) {
    try {
      const res = await apiFetch(`/mentorias/${mentoriaId}/agendar`, { method: 'POST' })
      notificar(res.mensagem, 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  async function handleTogglePresenca(inscricaoId: number, presente: boolean) {
    try {
      const res = await apiFetch(`/inscricoes/${inscricaoId}/presenca?presente=${presente}`, { method: 'PATCH' })
      notificar(res.mensagem, 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  async function handleSalvarPerfil(e: FormEvent) {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('nome', editNome)
      formData.append('curso', editCurso)
      formData.append('data_nascimento', editNascimento)
      formData.append('bio', bio)
      formData.append('competencias', competencias)
      formData.append('linkedin_url', linkedin)
      if (fotoPerfil) formData.append('foto', fotoPerfil)

      await apiFetch('/perfil', { method: 'PUT', body: formData })
      setFotoPerfil(null)
      setPreviewFotoPerfil(null)
      notificar('Seu perfil e foto foram atualizados!', 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  // --- AÇÕES DE SUPORTE E GESTOR ---
  async function handleAbrirChamadoSuporte(e: FormEvent) {
    e.preventDefault()
    try {
      const res = await apiFetch('/suporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assunto: assuntoSuporte, mensagem: msgSuporte }),
      })
      setAssuntoSuporte(''); setMsgSuporte('')
      notificar(res.mensagem, 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  async function handleResponderChamadoGestor(chamadoId: number) {
    const texto = respostasChamados[chamadoId]
    if (!texto || !texto.trim()) return
    try {
      const res = await apiFetch(`/suporte/${chamadoId}/responder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resposta_gestor: texto }),
      })
      notificar(res.mensagem, 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  async function handleCadastrarCursoGestor(e: FormEvent) {
    e.preventDefault()
    try {
      const res = await apiFetch('/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoCursoNome, area: novoCursoArea }),
      })
      setNovoCursoNome('')
      notificar(res.mensagem, 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  async function handleToggleCursoGestor(cursoId: number) {
    try {
      const res = await apiFetch(`/cursos/${cursoId}/toggle`, { method: 'PATCH' })
      notificar(res.mensagem, 'sucesso')
      carregarDados()
    } catch (err: any) {
      notificar(err.message, 'erro')
    }
  }

  const ToastBanner = toast ? (
    <div className="animate-toast fixed right-5 top-5 z-[100] flex items-center gap-3 rounded-2xl border border-[#245847] bg-[#173F32] px-4 py-3.5 text-white shadow-xl">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${
        toast.tipo === 'sucesso' ? 'bg-[#E4FF73] text-[#173F32]' : 'bg-red-500 text-white'
      }`}>
        {toast.tipo === 'sucesso' ? '✓' : '!'}
      </span>
      <p className="text-xs font-semibold">{toast.mensagem}</p>
      <button onClick={() => setToast(null)} className="ml-2 text-xs text-white/60 hover:text-white">✕</button>
    </div>
  ) : null

  // --- TELA DE LOGIN / CADASTRO SPLIT-SCREEN ---
  if (!token) {
    return (
      <div className="flex min-h-screen bg-[#F7F8F5]">
        {ToastBanner}

        {/* Coluna Esquerda: Painel Visual Minimalista Animado (Oculto em celulares) */}
        <div className="hero-grid relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#173F32] p-12 text-white lg:flex">
          <div className="animate-pulse-ring pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full border border-[#E4FF73]/25" />
          <div className="animate-pulse-ring pointer-events-none absolute -bottom-32 -left-20 h-[360px] w-[360px] rounded-full border border-white/15" />

          {/* Logo Superior */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xs">
              <span className="logo-mark"><span /><span /><span /></span>
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              conecta<span className="text-[#E4FF73]">campus</span>
            </span>
          </div>

          {/* Composição Minimalista Central (Livros + Objetos Acadêmicos Flutuantes) */}
          <div className="relative z-10 my-auto flex flex-col items-center">
            <div className="relative h-72 w-full max-w-md">
              {/* Card Flutuante 1: Pilha Minimalista de Livros */}
              <div className="animate-float-slow absolute left-4 top-2 w-60 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md shadow-2xl">
                <svg viewBox="0 0 180 95" className="w-full" fill="none">
                  <rect x="14" y="64" width="142" height="18" rx="4" fill="#E4FF73" />
                  <rect x="22" y="68" width="126" height="10" rx="2" fill="#173F32" opacity="0.2" />
                  <rect x="26" y="42" width="136" height="18" rx="4" fill="#63AE8F" />
                  <line x1="36" y1="51" x2="150" y2="51" stroke="#173F32" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
                  <rect x="18" y="20" width="128" height="18" rx="4" fill="#F7F8F5" />
                  <rect x="115" y="20" width="12" height="24" rx="2" fill="#E4FF73" />
                </svg>
                <p className="mt-2 text-xs font-extrabold text-white">Pesquisa & Extensão</p>
                <p className="text-[11px] text-[#C7D8D0]">Projetos interdisciplinares reais</p>
              </div>

              {/* Card Flutuante 2: Conexão de Equipe */}
              <div className="animate-float-reverse absolute bottom-2 right-2 w-64 rounded-2xl border border-white/15 bg-[#205141]/90 p-5 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4FF73] text-[10px] font-extrabold text-[#173F32]">DEV</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#63AE8F] text-[10px] font-extrabold text-white">UX</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-[#173F32]">TCC</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">Equipes Multidisciplinares</span>
                    <span className="text-[10px] text-[#C9E7D7]">+ Mentorias e Horas Validadas</span>
                  </div>
                </div>
                <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-3/4 rounded-full bg-[#E4FF73]" />
                </div>
              </div>
            </div>

            <div className="mt-8 max-w-md text-center">
              <h2 className="text-2xl font-extrabold leading-snug">
                Conecte talentos, cursos e ideias dentro da faculdade.
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#C7D8D0]">
                Encontre colegas para seu TCC, participe de workshops certificados e construa seu portfólio acadêmico.
              </p>
            </div>
          </div>

          {/* Rodapé Institucional */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-[#C7D8D0]">
            <span>Plataforma Acadêmica Integrada</span>
            <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-[#E4FF73]">Acesso Institucional</span>
          </div>
        </div>

        {/* Coluna Direita: Formulário de Login / Cadastro */}
        <div className="flex w-full items-center justify-center p-4 sm:p-8 lg:w-1/2">
          <div className="animate-page w-full max-w-md rounded-[26px] border border-[#E5E8E4] bg-white p-6 sm:p-9 shadow-sm">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <span className="logo-mark"><span /><span /><span /></span>
              <span className="text-lg font-extrabold">conecta<span className="text-[#4F836F]">campus</span></span>
            </div>

            <h1 className="text-2xl font-extrabold text-[#1D2B23]">
              {modoCadastro ? 'Criar conta acadêmica' : 'Bem-vindo de volta'}
            </h1>
            <p className="mt-1 text-xs text-[#78827C]">
              {modoCadastro ? 'Preencha seus dados oficiais (1 conta por CPF).' : 'Entre com suas credenciais institucionais para continuar.'}
            </p>

            <form key={modoCadastro ? 'form-cadastro' : 'form-login'} onSubmit={handleAuth} autoComplete="off" className="mt-6 space-y-3.5">
              {modoCadastro && (
                <>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[#5C6B63]">Tipo de Perfil</label>
                    <select value={papel} onChange={e => setPapel(e.target.value as any)}
                      className="w-full rounded-xl border border-[#E2E6E2] bg-[#F7F8F5] px-4 py-3 text-xs font-semibold outline-none">
                      <option value="ALUNO">Sou Aluno(a)</option>
                      <option value="PROFESSOR">Sou Professor(a) / Orientador</option>
                      <option value="VISITANTE">Sou Visitante / Comunidade Externa</option>
                    </select>
                  </div>
                  <input required autoComplete="off" placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6E2] px-4 py-3 text-xs outline-none focus:border-[#173F32]" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input required autoComplete="off" placeholder="CPF (somente números)" maxLength={14} value={cpf} onChange={e => setCpf(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E6E2] px-4 py-3 text-xs outline-none focus:border-[#173F32]" />
                    <input required autoComplete="off" type="text" inputMode="numeric" placeholder="Nascimento (DD/MM/AAAA)" maxLength={10}
                      value={dataNascimento} onChange={e => setDataNascimento(formatarDataInput(e.target.value))}
                      className="w-full rounded-xl border border-[#E2E6E2] px-4 py-3 text-xs outline-none focus:border-[#173F32]" />
                  </div>

                  {papel === 'VISITANTE' ? (
                    <input required autoComplete="off" placeholder="Empresa ou Instituição Externa"
                      value={curso} onChange={e => setCurso(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E6E2] px-4 py-3 text-xs outline-none focus:border-[#173F32]" />
                  ) : (
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#5C6B63]">Curso na Instituição</label>
                      <select required value={curso} onChange={e => setCurso(e.target.value)}
                        className="w-full rounded-xl border border-[#E2E6E2] bg-white px-4 py-3 text-xs font-semibold outline-none focus:border-[#173F32]">
                        {cursosAtivos.map(c => (
                          <option key={c.id} value={c.nome}>{c.nome} ({c.area})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
              <input required autoComplete="off" type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#E2E6E2] px-4 py-3 text-xs outline-none focus:border-[#173F32]" />
              <input required autoComplete="new-password" type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)}
                className="w-full rounded-xl border border-[#E2E6E2] px-4 py-3 text-xs outline-none focus:border-[#173F32]" />

              <button type="submit" className="w-full rounded-xl bg-[#173F32] py-3 text-xs font-bold text-white transition hover:bg-[#245847]">
                {modoCadastro ? 'Finalizar Cadastro' : 'Entrar'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { limparCamposAuth(); setModoCadastro(!modoCadastro) }}
              className="mt-5 w-full text-center text-xs font-semibold text-[#4F836F] hover:underline"
            >
              {modoCadastro ? 'Já possui conta? Fazer login' : 'Primeiro acesso? Criar conta'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- DASHBOARD PRINCIPAL ---
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      {ToastBanner}

      {menuMobileAberto && (
        <div onClick={() => setMenuMobileAberto(false)} className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden" />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-[#E5E8E4] bg-white px-4 py-6 transition-transform duration-300 lg:translate-x-0 ${
        menuMobileAberto ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-3">
            <span className="logo-mark"><span /><span /><span /></span>
            <span className="text-[15px] font-extrabold">conecta<span className="text-[#4F836F]">campus</span></span>
          </div>
          <button onClick={() => setMenuMobileAberto(false)} className="text-sm font-bold text-gray-400 lg:hidden">✕</button>
        </div>

        <nav className="mt-8 space-y-1">
          <button onClick={() => navegarPara('inicio')} className={`nav-item ${page === 'inicio' ? 'active' : ''}`}>Início</button>
          <button onClick={() => navegarPara('equipes')} className={`nav-item ${page === 'equipes' ? 'active' : ''}`}>Equipes e Projetos</button>
          <button onClick={() => navegarPara('mentorias')} className={`nav-item ${page === 'mentorias' ? 'active' : ''}`}>Mentorias & Palestras</button>
          <button onClick={() => navegarPara('mensagens')} className={`nav-item justify-between ${page === 'mensagens' ? 'active' : ''}`}>
            <span>Mensagens</span>
            {conversas.length > 0 && (
              <span className="rounded-full bg-[#E4FF73] px-2 py-0.5 text-[10px] font-extrabold text-[#173F32]">
                {conversas.length}
              </span>
            )}
          </button>

          {usuario?.papel === 'GESTOR' ? (
            <button onClick={() => navegarPara('gestor')} className={`nav-item justify-between ${page === 'gestor' ? 'active' : ''}`}>
              <span>Painel do Gestor</span>
              {metricasGestor && metricasGestor.chamados_abertos > 0 && (
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                  {metricasGestor.chamados_abertos}
                </span>
              )}
            </button>
          ) : (
            <button onClick={() => navegarPara('suporte')} className={`nav-item ${page === 'suporte' ? 'active' : ''}`}>
              Falar com o Suporte
            </button>
          )}

          <button onClick={() => navegarPara('perfil')} className={`nav-item ${page === 'perfil' ? 'active' : ''}`}>Meu Perfil</button>
        </nav>

        <button onClick={() => navegarPara('perfil')} className="mt-auto w-full rounded-[18px] bg-[#EFF6F1] p-4 text-left transition hover:bg-[#E2EFE6]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#254437]">Complete seu perfil</p>
            <span className="text-xs font-bold text-[#4F836F]">→</span>
          </div>
          <p className="mt-1 text-[11px] text-[#718078]">Clique para trocar foto, bio e skills.</p>
          <div className="mt-3 h-1.5 rounded-full bg-white">
            <div className="h-full rounded-full bg-[#4F836F] transition-all duration-500" style={{ width: `${usuario?.perfil_progresso || 40}%` }} />
          </div>
          <p className="mt-2 text-[10px] font-semibold text-[#60736A]">{usuario?.perfil_progresso || 40}% completo</p>
        </button>

        <div className="mt-4 flex items-center justify-between border-t border-[#E8EBE8] px-1 pt-4">
          <button onClick={() => navegarPara('perfil')} className="flex items-center gap-2.5 text-left transition hover:opacity-80">
            {usuario?.foto_url ? (
              <img src={usuario.foto_url} alt={usuario.nome} className="h-9 w-9 rounded-full object-cover border border-[#E2E6E2]" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173F32] text-xs font-bold text-[#E4FF73]">
                {usuario?.nome?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="max-w-[125px] truncate">
              <span className="rounded bg-[#EAF2ED] px-1.5 py-0.5 text-[8px] font-extrabold text-[#173F32]">{usuario?.papel}</span>
              <strong className="mt-0.5 block truncate text-xs">{usuario?.nome}</strong>
              <small className="block truncate text-[10px] text-[#859087]">{usuario?.curso}</small>
            </div>
          </button>
          <button onClick={handleLogout} className="text-[11px] font-bold text-red-500 hover:underline">Sair</button>
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-[#E5E8E4] bg-[#F7F8F5]/90 px-4 py-3 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuMobileAberto(true)} className="rounded-xl border border-[#E2E6E2] bg-white p-2 text-sm font-bold lg:hidden">☰</button>
            <div className="text-xs text-[#7B867F]">Olá, <strong className="text-[#33453B]">{usuario?.nome}</strong></div>
          </div>

          <div className="flex flex-wrap gap-2">
            {usuario?.papel !== 'VISITANTE' && (
              <button onClick={() => setModalNovaMentoria(true)} className="rounded-xl border border-[#173F32] px-3 py-2 text-[11px] sm:text-xs font-bold text-[#173F32] transition hover:bg-[#EAF2ED]">
                + Palestra / Mentoria
              </button>
            )}
            <button onClick={() => setModalNovoProjeto(true)} className="rounded-xl bg-[#173F32] px-3.5 py-2 text-[11px] sm:text-xs font-bold text-white transition hover:bg-[#245847]">
              + Criar Projeto
            </button>
          </div>
        </header>

        <main key={page} className="animate-page mx-auto max-w-[1200px] p-4 sm:p-8">
          {(page === 'inicio' || page === 'equipes') && (
            <>
              {page === 'inicio' && (
                <section className="hero-grid mb-10 overflow-hidden rounded-[28px] bg-[#173F32] p-6 sm:p-10 text-white">
                  <div className="relative z-10 max-w-xl">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#C9E7D7]">
                      Ecossistema Acadêmico
                    </span>
                    <h1 className="mt-4 text-2xl sm:text-4xl font-extrabold leading-tight">
                      Boas ideias crescem quando talentos se encontram.
                    </h1>
                    <p className="mt-3 text-xs sm:text-sm text-[#C7D8D0]">
                      Forme equipes presenciais, semipresenciais ou remotas, participe de palestras validadas e construa seu portfólio.
                    </p>
                  </div>
                  <div className="hero-orbit hidden md:block">
                    <span className="orbit-card card-a">UX</span>
                    <span className="orbit-card card-b">DEV</span>
                    <span className="orbit-card card-c">PESQ</span>
                    <span className="orbit-center">TEAM</span>
                  </div>
                </section>
              )}

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <h2 className="text-xl font-extrabold">Projetos e Equipes</h2>
                <div className="flex flex-wrap gap-2">
                  {['Todas', 'Tecnologia', 'Saúde', 'Educação', 'Impacto social'].map(cat => (
                    <button key={cat} onClick={() => setFiltroCategoria(cat)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${filtroCategoria === cat ? 'bg-[#173F32] text-white' : 'border border-[#DFE4DF] bg-white text-[#647169]'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {projetos.map(p => (
                  <article key={p.id} className="card-hover flex flex-col overflow-hidden rounded-[22px] border border-[#E6E8E3] bg-white">
                    {p.foto_url && (
                      <img src={p.foto_url} alt={p.titulo} className="h-40 w-full object-cover border-b border-[#E6E8E3]" />
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-[#F4F5F1] px-2.5 py-1 text-[10px] font-semibold text-[#687169]">{p.categoria}</span>
                          <span className="rounded-full bg-[#EAF2ED] px-2.5 py-1 text-[10px] font-bold text-[#173F32]">
                            {formatarModalidadeLabel(p.modalidade)}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            p.status === 'ABERTO' ? 'bg-emerald-50 text-emerald-700' :
                            p.status === 'EM_ANDAMENTO' ? 'bg-amber-50 text-amber-700' :
                            p.status === 'CANCELADO' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {p.status.replace('_', ' ')}
                          </span>
                        </div>
                        {p.orientador_nome && (
                          <span className="rounded-full bg-[#E4FF73] px-2.5 py-0.5 text-[10px] font-extrabold text-[#173F32]">
                            ✓ {p.orientador_nome}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-lg font-bold">{p.titulo}</h3>
                      <p className="text-[11px] text-[#859087]">Líder: {p.criador_nome}</p>

                      {(p.localizacao || p.link_reuniao) && (
                        <div className="mt-2.5 rounded-xl bg-[#F7F8F5] px-3 py-2 text-[11px] text-[#4A5850]">
                          {p.localizacao && <p><strong>Local:</strong> {p.localizacao}</p>}
                          {p.link_reuniao && (
                            <p className="truncate">
                              <strong>Ambiente Virtual:</strong>{' '}
                              <a href={p.link_reuniao} target="_blank" rel="noreferrer" className="font-bold text-[#1C5A45] underline">
                                Acessar sala
                              </a>
                            </p>
                          )}
                        </div>
                      )}

                      <p className="mt-2.5 text-xs leading-relaxed text-[#667169]">{p.descricao}</p>

                      {p.status === 'CONCLUIDO' && p.link_entrega && (
                        <a
                          href={p.link_entrega}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block rounded-xl bg-[#E4FF73] px-3 py-2 text-center text-xs font-extrabold text-[#173F32] transition hover:opacity-90"
                        >
                          ↗ Ver Entregável / Repositório Final
                        </a>
                      )}

                      <div className="mt-4 space-y-2">
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7A837D]">
                          Vagas e Competências Exigidas
                        </span>
                        {p.vagas.length === 0 && <p className="text-[11px] text-gray-400">Nenhuma vaga cadastrada.</p>}
                        {p.vagas.map(v => (
                          <div key={v.id} className="rounded-xl border border-[#E9ECE8] bg-[#F9FAF8] p-3">
                            <div className="flex items-center justify-between gap-2">
                              <strong className="text-xs text-[#1D2B23]">{v.titulo_vaga}</strong>
                              <span className="rounded bg-[#EAF2ED] px-2 py-0.5 text-[10px] font-bold text-[#173F32]">
                                {v.quantidade} {v.quantidade === 1 ? 'vaga' : 'vagas'}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {v.competencias_vaga.split(',').map(comp => (
                                <span key={comp} className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-[#5C6B63] border border-[#E4E8E4]">
                                  {comp.trim()}
                                </span>
                              ))}
                            </div>
                            {p.criador_id !== usuario?.id && usuario?.papel !== 'VISITANTE' && v.quantidade > 0 && p.status === 'ABERTO' && (
                              <button
                                onClick={() => v.id && handleCandidatarVaga(v.id)}
                                className="mt-2.5 w-full rounded-lg bg-[#173F32] py-1.5 text-[11px] font-bold text-white transition hover:bg-[#245847]"
                              >
                                Candidatar-se a esta vaga
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {p.membros && p.membros.length > 0 && (
                        <div className="mt-4 rounded-xl bg-[#F4F6F3] p-2.5">
                          <span className="block text-[10px] font-bold uppercase text-[#7A837D]">Equipe Formada ({p.membros.length})</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.membros.map(m => (
                              <span key={m.id} className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold border border-[#E5E8E4]">
                                {m.usuario_nome} · <span className="text-[#4F836F]">{m.funcao}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-auto pt-4">
                        <div className="mb-3 h-px bg-[#EDF0ED]" />
                        <div className="flex items-center justify-between gap-2">
                          {p.criador_id === usuario?.id ? (
                            <button
                              onClick={() => abrirGerenciarProjeto(p)}
                              className="w-full rounded-xl border border-[#173F32] bg-[#EAF2ED] py-2 text-xs font-extrabold text-[#173F32] transition hover:bg-[#dce9e1]"
                            >
                              ⚙ Gerenciar Projeto e Vagas
                            </button>
                          ) : usuario?.papel === 'PROFESSOR' && !p.orientador_nome ? (
                            <button
                              onClick={() => handleOrientarProjeto(p.id)}
                              className="w-full rounded-xl bg-[#E4FF73] py-2 text-xs font-extrabold text-[#173F32]"
                            >
                              Assumir Orientação Docente
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#859087]">Tags: {p.tags}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {page === 'mentorias' && (
            <div>
              <h1 className="text-2xl font-extrabold">Mentorias, Palestras & Workshops</h1>
              <p className="mt-1 text-xs text-[#738077]">Sessões presenciais, semipresenciais ou remotas com validação de presença.</p>
              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {mentorias.map(m => {
                  const minhaInscricao = m.inscritos.find(i => i.usuario_id === usuario?.id)
                  const lotado = m.inscritos.length >= m.capacidade

                  return (
                    <article key={m.id} className="card-hover flex flex-col rounded-[20px] border border-[#E3E7E3] bg-white p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-[#EAF2ED] px-2.5 py-1 text-[10px] font-extrabold text-[#173F32]">{m.tipo}</span>
                          <span className="rounded-full bg-[#F4F5F1] px-2.5 py-1 text-[10px] font-bold text-[#5C6B63]">
                            {formatarModalidadeLabel(m.modalidade)}
                          </span>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          m.status === 'AGENDADA' ? 'bg-emerald-50 text-emerald-700' :
                          m.status === 'ADIADA' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {m.status}
                        </span>
                      </div>

                      <h3 className="mt-3 font-bold">{m.mentor_nome}</h3>
                      <p className="text-xs text-[#7A837D]">{m.mentor_cargo}</p>

                      {(m.localizacao || m.link_reuniao) && (
                        <div className="mt-3 rounded-xl bg-[#F7F8F5] px-3 py-2 text-[11px] text-[#4A5850]">
                          {m.localizacao && <p><strong>Local:</strong> {m.localizacao}</p>}
                          {m.link_reuniao && (
                            <p className="truncate">
                              <strong>Transmissão:</strong>{' '}
                              <a href={m.link_reuniao} target="_blank" rel="noreferrer" className="font-bold text-[#1C5A45] underline">
                                Entrar na sala
                              </a>
                            </p>
                          )}
                        </div>
                      )}

                      <div className="my-4 h-px bg-[#EDF0ED]" />
                      <p className="text-[10px] font-bold uppercase text-[#839087]">Tema</p>
                      <p className="mt-1 flex-1 text-sm font-semibold">{m.area}</p>

                      <div className="mt-4 flex items-center justify-between text-[11px] text-[#667169]">
                        <span>Vagas ocupadas:</span>
                        <strong>{m.inscritos.length} / {m.capacidade}</strong>
                      </div>

                      {minhaInscricao?.presente && (
                        <div className="mt-2 rounded-lg bg-[#E4FF73] px-3 py-1.5 text-center text-[11px] font-extrabold text-[#173F32]">
                          ✓ Presença Validada (Horas Complementares)
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F6F7F4] p-3 text-xs">
                        <span className={m.status === 'CANCELADA' ? 'line-through text-gray-400' : 'font-medium'}>
                          {m.horario_disponivel}
                        </span>
                        {m.status === 'CANCELADA' ? (
                          <span className="font-bold text-red-500">Cancelada</span>
                        ) : minhaInscricao ? (
                          <span className="font-bold text-[#1C5A45]">✓ Inscrito</span>
                        ) : lotado ? (
                          <span className="font-bold text-gray-400">Lotado</span>
                        ) : m.mentor_id !== usuario?.id ? (
                          <button onClick={() => handleAgendarMentoria(m.id)} className="font-bold text-[#1C5A45] hover:underline">Inscrever-se</button>
                        ) : null}
                      </div>

                      {m.mentor_id === usuario?.id && (
                        <button
                          onClick={() => abrirGerenciarMentoria(m)}
                          className="mt-3 w-full rounded-xl border border-[#173F32] bg-[#EAF2ED] py-2 text-xs font-extrabold text-[#173F32] transition hover:bg-[#dce9e1]"
                        >
                          ⚙ Gerenciar / Presença ({m.inscritos.length})
                        </button>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          )}

          {page === 'mensagens' && (
            <div className="grid min-h-[550px] grid-cols-1 overflow-hidden rounded-[24px] border border-[#E5E8E4] bg-white md:grid-cols-3">
              <div className="border-b border-[#E5E8E4] p-4 md:border-b-0 md:border-r">
                <h2 className="px-2 text-sm font-extrabold">Candidaturas & Chat</h2>
                <div className="mt-4 space-y-2">
                  {conversas.length === 0 && <p className="px-2 text-xs text-gray-400">Nenhuma conversa ativa ainda.</p>}
                  {conversas.map(c => (
                    <button key={c.id} onClick={() => setConversaAtiva(c)}
                      className={`w-full rounded-xl p-3 text-left transition ${conversaAtiva?.id === c.id ? 'bg-[#EAF2ED]' : 'hover:bg-[#F7F8F5]'}`}>
                      <div className="flex items-center justify-between">
                        <strong className="text-xs">{c.projeto_titulo}</strong>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          c.status === 'ACEITO' ? 'bg-green-100 text-green-700' :
                          c.status === 'RECUSADO' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
                        }`}>{c.status}</span>
                      </div>
                      <p className="mt-0.5 text-[10px] font-bold text-[#4F836F]">Vaga: {c.vaga_titulo}</p>
                      <p className="mt-1 text-[11px] text-[#667169]">
                        {c.sou_dono_projeto ? `Candidato: ${c.candidato_nome}` : 'Sua candidatura enviada'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex flex-col">
                {!conversaAtiva ? (
                  <div className="flex flex-1 items-center justify-center p-8 text-center text-xs text-gray-400">
                    Selecione uma candidatura ao lado para conversar ou aceitar o membro na equipe.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E8E4] p-4">
                      <div>
                        <strong className="text-sm">{conversaAtiva.projeto_titulo} — {conversaAtiva.vaga_titulo}</strong>
                        <p className="text-[11px] text-gray-500">Candidato: {conversaAtiva.candidato_nome} ({conversaAtiva.candidato_curso})</p>
                      </div>
                      {conversaAtiva.sou_dono_projeto && conversaAtiva.status === 'PENDENTE' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleResponderCandidatura(conversaAtiva.id, true)}
                            className="rounded-lg bg-[#173F32] px-3 py-1.5 text-xs font-bold text-white">
                            Aceitar na Equipe
                          </button>
                          <button onClick={() => handleResponderCandidatura(conversaAtiva.id, false)}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                            Recusar
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="max-h-[380px] flex-1 space-y-3 overflow-y-auto bg-[#F7F8F5] p-4">
                      {mensagens.map(m => (
                        <div key={m.id} className={`max-w-md rounded-2xl p-3 text-xs ${
                          m.remetente_id === usuario?.id ? 'ml-auto bg-[#173F32] text-white' : 'bg-white border border-[#E5E8E4]'
                        }`}>
                          <span className="block text-[10px] font-bold opacity-75">{m.remetente_nome} · {m.enviada_em}</span>
                          <p className="mt-1">{m.texto}</p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleEnviarMensagem} className="flex gap-2 border-t border-[#E5E8E4] p-3">
                      <input value={novaMsg} onChange={e => setNovaMsg(e.target.value)} placeholder="Escreva uma mensagem..."
                        className="flex-1 rounded-xl border border-[#E2E6E2] px-4 py-2.5 text-xs outline-none" />
                      <button type="submit" className="rounded-xl bg-[#173F32] px-5 py-2.5 text-xs font-bold text-white">Enviar</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ABA SUPORTE (ALUNOS, PROFESSORES E VISITANTES) */}
          {page === 'suporte' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-[24px] border border-[#E3E7E3] bg-white p-6">
                <h2 className="text-lg font-extrabold">Falar com o Suporte</h2>
                <p className="mt-1 text-xs text-[#738077]">
                  Precisa solicitar a inclusão de um novo curso, relatar um problema ou tirar dúvidas com a coordenação?
                </p>
                <form onSubmit={handleAbrirChamadoSuporte} className="mt-5 space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold">Assunto</label>
                    <input required placeholder="Ex: Solicitação de novo curso / Dúvida" value={assuntoSuporte}
                      onChange={e => setAssuntoSuporte(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#E2E6E2] p-3 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold">Mensagem para a Instituição</label>
                    <textarea required rows={4} placeholder="Descreva sua solicitação detalhadamente..." value={msgSuporte}
                      onChange={e => setMsgSuporte(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#E2E6E2] p-3 text-xs outline-none" />
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-[#173F32] py-3 text-xs font-bold text-white transition hover:bg-[#245847]">
                    Enviar Solicitação
                  </button>
                </form>
              </div>

              <div className="space-y-4 lg:col-span-2">
                <h2 className="text-lg font-extrabold">Minhas Solicitações ({chamados.length})</h2>
                {chamados.length === 0 && (
                  <div className="rounded-[20px] border border-[#E3E7E3] bg-white p-8 text-center text-xs text-gray-400">
                    Você ainda não abriu nenhum chamado de suporte.
                  </div>
                )}
                {chamados.map(c => (
                  <div key={c.id} className="rounded-[20px] border border-[#E3E7E3] bg-white p-5">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm">{c.assunto}</strong>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        c.status === 'RESPONDIDO' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">Enviado em {c.criado_em}</p>
                    <p className="mt-3 text-xs text-[#4A5850]">{c.mensagem}</p>

                    {c.resposta_gestor && (
                      <div className="mt-4 rounded-xl border border-[#C5D4CB] bg-[#EFF6F1] p-3.5 text-xs">
                        <strong className="block text-[#173F32]">Resposta da Coordenação / Suporte:</strong>
                        <p className="mt-1 text-[#254437]">{c.resposta_gestor}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAINEL EXCLUSIVO DO GESTOR / ENTIDADE */}
          {page === 'gestor' && usuario?.papel === 'GESTOR' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-extrabold">Painel de Gestão Institucional</h1>
                <p className="mt-1 text-xs text-[#738077]">Administre os cursos ofertados pela faculdade, acompanhe indicadores e responda ao suporte.</p>
              </div>

              {metricasGestor && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-[20px] border border-[#E3E7E3] bg-white p-5">
                    <span className="text-[11px] font-bold text-[#78827C]">Comunidade Ativa</span>
                    <strong className="mt-1 block text-2xl font-extrabold text-[#173F32]">{metricasGestor.total_usuarios}</strong>
                    <small className="text-[10px] text-[#4F836F]">{metricasGestor.total_alunos} alunos · {metricasGestor.total_professores} docentes</small>
                  </div>
                  <div className="rounded-[20px] border border-[#E3E7E3] bg-white p-5">
                    <span className="text-[11px] font-bold text-[#78827C]">Projetos Criados</span>
                    <strong className="mt-1 block text-2xl font-extrabold text-[#173F32]">{metricasGestor.total_projetos}</strong>
                    <small className="text-[10px] text-[#4F836F]">{metricasGestor.projetos_concluidos} concluídos</small>
                  </div>
                  <div className="rounded-[20px] border border-[#E3E7E3] bg-white p-5">
                    <span className="text-[11px] font-bold text-[#78827C]">Palestras & Mentorias</span>
                    <strong className="mt-1 block text-2xl font-extrabold text-[#173F32]">{metricasGestor.total_sessoes}</strong>
                    <small className="text-[10px] text-[#4F836F]">Eventos registrados</small>
                  </div>
                  <div className="rounded-[20px] border border-[#E3E7E3] bg-white p-5">
                    <span className="text-[11px] font-bold text-[#78827C]">Chamados Abertos</span>
                    <strong className="mt-1 block text-2xl font-extrabold text-amber-700">{metricasGestor.chamados_abertos}</strong>
                    <small className="text-[10px] text-gray-500">Aguardando resposta</small>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="rounded-[24px] border border-[#E3E7E3] bg-white p-6">
                  <h2 className="text-base font-extrabold">Catálogo Oficial de Cursos</h2>
                  <p className="mt-1 text-xs text-[#738077]">Estes cursos aparecem no menu suspenso de cadastro e perfil.</p>

                  <form onSubmit={handleCadastrarCursoGestor} className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input required placeholder="Nome do curso (ex: Biomedicina)" value={novoCursoNome}
                      onChange={e => setNovoCursoNome(e.target.value)} className="flex-1 rounded-xl border p-2.5 text-xs" />
                    <select value={novoCursoArea} onChange={e => setNovoCursoArea(e.target.value)} className="rounded-xl border p-2.5 text-xs">
                      <option value="Tecnologia">Tecnologia</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Humanas">Humanas</option>
                      <option value="Exatas">Exatas</option>
                      <option value="Negócios">Negócios</option>
                    </select>
                    <button type="submit" className="rounded-xl bg-[#173F32] px-4 py-2.5 text-xs font-bold text-white">
                      + Adicionar
                    </button>
                  </form>

                  <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
                    {todosCursosGestor.map(c => (
                      <div key={c.id} className="flex items-center justify-between rounded-xl border bg-[#F7F8F5] p-3 text-xs">
                        <div>
                          <strong className={!c.ativo ? 'line-through text-gray-400' : ''}>{c.nome}</strong>
                          <span className="ml-2 rounded bg-white px-2 py-0.5 text-[10px] text-gray-500">{c.area}</span>
                        </div>
                        <button onClick={() => handleToggleCursoGestor(c.id)}
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                            c.ativo ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                          {c.ativo ? 'Desativar' : 'Reativar'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#E3E7E3] bg-white p-6">
                  <h2 className="text-base font-extrabold">Atendimento ao Suporte ({chamados.length})</h2>
                  <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto">
                    {chamados.length === 0 && <p className="text-xs text-gray-400">Nenhum chamado registrado.</p>}
                    {chamados.map(c => (
                      <div key={c.id} className="rounded-xl border border-[#E5E8E4] bg-[#F9FAF8] p-4 text-xs">
                        <div className="flex items-center justify-between">
                          <strong>{c.assunto}</strong>
                          <span className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                            c.status === 'RESPONDIDO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                          }`}>{c.status}</span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-gray-500">Por: {c.usuario_nome} ({c.usuario_papel}) · {c.criado_em}</p>
                        <p className="mt-2 text-[#33453B]">{c.mensagem}</p>

                        {c.resposta_gestor ? (
                          <div className="mt-3 rounded-lg bg-[#EFF6F1] p-2.5 text-[11px] text-[#173F32]">
                            <strong>Respondido:</strong> {c.resposta_gestor}
                          </div>
                        ) : (
                          <div className="mt-3 flex gap-2">
                            <input
                              placeholder="Escreva a resposta oficial..."
                              value={respostasChamados[c.id] || ''}
                              onChange={e => setRespostasChamados({ ...respostasChamados, [c.id]: e.target.value })}
                              className="flex-1 rounded-lg border bg-white px-3 py-2 text-xs outline-none"
                            />
                            <button onClick={() => handleResponderChamadoGestor(c.id)}
                              className="rounded-lg bg-[#173F32] px-3 py-2 text-xs font-bold text-white">
                              Responder
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA MEU PERFIL */}
          {page === 'perfil' && (
            <div className="mx-auto max-w-2xl rounded-[24px] border border-[#E3E7E3] bg-white p-6 sm:p-8">
              <div className="flex flex-col items-center gap-5 sm:flex-row">
                <label className="group relative cursor-pointer" title="Clique para trocar sua foto de perfil">
                  {previewFotoPerfil || usuario?.foto_url ? (
                    <img
                      src={previewFotoPerfil || usuario?.foto_url}
                      alt={usuario?.nome}
                      className="h-24 w-24 rounded-full object-cover border-2 border-[#173F32] transition group-hover:opacity-75"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#173F32] text-3xl font-bold text-[#E4FF73] transition group-hover:opacity-85">
                      {usuario?.nome?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 rounded-full bg-[#E4FF73] px-2 py-0.5 text-[10px] font-extrabold text-[#173F32] shadow">
                    Editar foto
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleSelecionarFotoPerfil(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>

                <div>
                  <span className="rounded-full bg-[#EAF2ED] px-3 py-1 text-[10px] font-extrabold text-[#173F32]">{usuario?.papel}</span>
                  <h2 className="mt-1 text-xl font-bold">{usuario?.nome}</h2>
                  <p className="text-xs text-[#738077]">CPF: {usuario?.cpf} · E-mail: {usuario?.email}</p>
                  {fotoPerfil && (
                    <p className="mt-1 text-[11px] font-bold text-[#1C5A45]">Nova foto selecionada: {fotoPerfil.name} (clique em Salvar)</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleSalvarPerfil} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold">Nome Completo</label>
                    <input required value={editNome} onChange={e => setEditNome(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#E2E6E2] p-3 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold">Data de Nascimento (DD/MM/AAAA)</label>
                    <input required type="text" inputMode="numeric" maxLength={10} value={editNascimento}
                      onChange={e => setEditNascimento(formatarDataInput(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-[#E2E6E2] p-3 text-xs outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold">Curso / Vínculo</label>
                    {usuario?.papel === 'VISITANTE' || usuario?.papel === 'GESTOR' ? (
                      <input required value={editCurso} onChange={e => setEditCurso(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#E2E6E2] p-3 text-xs outline-none" />
                    ) : (
                      <select value={editCurso} onChange={e => setEditCurso(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#E2E6E2] bg-white p-3 text-xs font-semibold outline-none">
                        {cursosAtivos.map(c => (
                          <option key={c.id} value={c.nome}>{c.nome}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold">Link do LinkedIn / Portfólio</label>
                    <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..."
                      className="mt-1 w-full rounded-xl border border-[#E2E6E2] p-3 text-xs outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold">Bio / Resumo Acadêmico</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    className="mt-1 w-full rounded-xl border border-[#E2E6E2] p-3 text-xs outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold">Competências (separadas por vírgula)</label>
                  <input value={competencias} onChange={e => setCompetencias(e.target.value)} placeholder="Ex: Python, FastAPI, React, Figma"
                    className="mt-1 w-full rounded-xl border border-[#E2E6E2] p-3 text-xs outline-none" />
                </div>

                <button type="submit" className="rounded-xl bg-[#173F32] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#245847]">
                  Salvar Alterações
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Modal Criar Projeto */}
      {modalNovoProjeto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
          <div className="animate-modal my-8 w-full max-w-lg rounded-[24px] bg-white p-6">
            <h2 className="text-lg font-bold">Publicar Novo Projeto</h2>
            <form onSubmit={handleCriarProjeto} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600">Imagem de Capa (Opcional)</label>
                <input type="file" accept="image/*" onChange={e => setFotoProjeto(e.target.files?.[0] || null)} className="mt-1 w-full rounded-xl border p-2 text-xs" />
              </div>
              <input required placeholder="Nome do projeto" value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} className="w-full rounded-xl border p-3 text-xs" />

              <div className="grid grid-cols-2 gap-2">
                <select value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} className="w-full rounded-xl border p-3 text-xs">
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Educação">Educação</option>
                  <option value="Impacto social">Impacto social</option>
                </select>
                <select value={novaModalidadeProj} onChange={e => setNovaModalidadeProj(e.target.value as any)} className="w-full rounded-xl border p-3 text-xs font-bold text-[#173F32]">
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="SEMIPRESENCIAL">Semipresencial</option>
                  <option value="REMOTO">Remoto</option>
                </select>
              </div>

              {(novaModalidadeProj === 'PRESENCIAL' || novaModalidadeProj === 'SEMIPRESENCIAL') && (
                <input required placeholder="Local na Instituição (ex: Bloco B - Lab de Redes 02)" value={novoLocalProj}
                  onChange={e => setNovoLocalProj(e.target.value)} className="w-full rounded-xl border border-[#4F836F] bg-[#F7F8F5] p-3 text-xs" />
              )}
              {(novaModalidadeProj === 'REMOTO' || novaModalidadeProj === 'SEMIPRESENCIAL') && (
                <input required={novaModalidadeProj === 'REMOTO'} placeholder="Link do Ambiente Virtual (ex: https://meet.google.com/...)" value={novoLinkProj}
                  onChange={e => setNovoLinkProj(e.target.value)} className="w-full rounded-xl border border-[#4F836F] bg-[#F7F8F5] p-3 text-xs" />
              )}

              <input required placeholder="Tags gerais (ex: TCC, Web, Inovação)" value={novasTags} onChange={e => setNovasTags(e.target.value)} className="w-full rounded-xl border p-3 text-xs" />
              <textarea required placeholder="Descrição do objetivo do projeto" value={novaDesc} onChange={e => setNovaDesc(e.target.value)} className="w-full rounded-xl border p-3 text-xs" />

              <div className="rounded-2xl bg-[#F7F8F5] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#173F32]">Vagas e Competências Pedidas</span>
                  <button
                    type="button"
                    onClick={() => setVagasNovoProjeto([...vagasNovoProjeto, { titulo_vaga: '', competencias_vaga: '', quantidade: 1 }])}
                    className="rounded-lg bg-[#E4FF73] px-2.5 py-1 text-[10px] font-extrabold text-[#173F32]"
                  >
                    + Adicionar Vaga
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {vagasNovoProjeto.map((v, idx) => (
                    <div key={idx} className="rounded-xl border border-[#E2E6E2] bg-white p-3 space-y-2">
                      <div className="flex gap-2">
                        <input required placeholder="Cargo (ex: Dev Back-end)" value={v.titulo_vaga}
                          onChange={e => atualizarCampoVagaNovoProjeto(idx, 'titulo_vaga', e.target.value)}
                          className="flex-1 rounded-lg border p-2 text-xs" />
                        <input required type="number" min={1} max={10} value={v.quantidade}
                          onChange={e => atualizarCampoVagaNovoProjeto(idx, 'quantidade', Number(e.target.value))}
                          className="w-16 rounded-lg border p-2 text-xs" />
                      </div>
                      <input required placeholder="Competências/Tecnologias (ex: Python, FastAPI)"
                        value={v.competencias_vaga}
                        onChange={e => atualizarCampoVagaNovoProjeto(idx, 'competencias_vaga', e.target.value)}
                        className="w-full rounded-lg border p-2 text-xs" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setModalNovoProjeto(false)} className="px-4 py-2 text-xs font-bold text-gray-500">Cancelar</button>
                <button type="submit" className="rounded-xl bg-[#173F32] px-5 py-2 text-xs font-bold text-white">Publicar Projeto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerenciar Projeto */}
      {projetoGerenciando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
          <div className="animate-modal my-8 w-full max-w-2xl rounded-[24px] bg-white p-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold">Configurações do Projeto: {projetoGerenciando.titulo}</h2>
              <button onClick={() => setProjetoGerenciando(null)} className="text-sm font-bold text-gray-400">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <form onSubmit={handleSalvarEdicaoProjeto} className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase text-[#4F836F]">Dados Gerais, Modalidade e Entrega</h3>
                <input required value={editProjTitulo} onChange={e => setEditProjTitulo(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={editProjCategoria} onChange={e => setEditProjCategoria(e.target.value)} className="rounded-xl border p-2.5 text-xs">
                    <option value="Tecnologia">Tecnologia</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Educação">Educação</option>
                    <option value="Impacto social">Impacto social</option>
                  </select>
                  <select value={editProjStatus} onChange={e => setEditProjStatus(e.target.value)} className="rounded-xl border p-2.5 text-xs font-bold">
                    <option value="ABERTO">Aberto a Vagas</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>

                <select value={editProjModalidade} onChange={e => setEditProjModalidade(e.target.value as any)} className="w-full rounded-xl border p-2.5 text-xs font-bold text-[#173F32]">
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="SEMIPRESENCIAL">Semipresencial</option>
                  <option value="REMOTO">Remoto</option>
                </select>

                {(editProjModalidade === 'PRESENCIAL' || editProjModalidade === 'SEMIPRESENCIAL') && (
                  <input placeholder="Local na Instituição" value={editProjLocal} onChange={e => setEditProjLocal(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs" />
                )}
                {(editProjModalidade === 'REMOTO' || editProjModalidade === 'SEMIPRESENCIAL') && (
                  <input placeholder="Link da Reunião / Discord" value={editProjLink} onChange={e => setEditProjLink(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs" />
                )}

                {editProjStatus === 'CONCLUIDO' && (
                  <input placeholder="Link do Entregável Final (GitHub, Figma, Artigo)" value={editProjEntrega}
                    onChange={e => setEditProjEntrega(e.target.value)} className="w-full rounded-xl border border-[#4F836F] bg-[#EFF6F1] p-2.5 text-xs font-semibold" />
                )}

                <textarea required rows={3} value={editProjDesc} onChange={e => setEditProjDesc(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs" />
                <input required value={editProjTags} onChange={e => setEditProjTags(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs" />
                <div>
                  <label className="block text-[10px] font-bold text-gray-500">Trocar Imagem de Capa</label>
                  <input type="file" accept="image/*" onChange={e => setEditProjFoto(e.target.files?.[0] || null)} className="mt-1 w-full rounded-xl border p-2 text-xs" />
                </div>
                <button type="submit" className="w-full rounded-xl bg-[#173F32] py-2.5 text-xs font-bold text-white">
                  Salvar Alterações
                </button>
              </form>

              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase text-[#4F836F]">Vagas do Projeto</h3>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {projetoGerenciando.vagas.map(v => (
                    <div key={v.id} className="flex items-center justify-between rounded-xl border bg-[#F7F8F5] p-2.5 text-xs">
                      <div>
                        <strong className="block">{v.titulo_vaga} ({v.quantidade})</strong>
                        <span className="text-[10px] text-gray-500">{v.competencias_vaga}</span>
                      </div>
                      {v.id && (
                        <button onClick={() => handleRemoverVaga(v.id!)} className="text-[11px] font-bold text-red-500 hover:underline">
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAdicionarVagaNoProjeto} className="rounded-xl border border-dashed border-[#4F836F] p-3 space-y-2">
                  <span className="block text-[11px] font-bold text-[#173F32]">+ Abrir Nova Vaga</span>
                  <div className="flex gap-2">
                    <input required placeholder="Cargo (ex: UI Designer)" value={addVagaTitulo} onChange={e => setAddVagaTitulo(e.target.value)} className="flex-1 rounded-lg border p-2 text-xs" />
                    <input required type="number" min={1} max={10} value={addVagaQtd} onChange={e => setAddVagaQtd(Number(e.target.value))} className="w-16 rounded-lg border p-2 text-xs" />
                  </div>
                  <input required placeholder="Competências (ex: Figma, Prototipação)" value={addVagaComp} onChange={e => setAddVagaComp(e.target.value)} className="w-full rounded-lg border p-2 text-xs" />
                  <button type="submit" className="w-full rounded-lg bg-[#E4FF73] py-2 text-xs font-extrabold text-[#173F32]">
                    Adicionar Vaga
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Oferecer Mentoria / Palestra */}
      {modalNovaMentoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="animate-modal w-full max-w-md rounded-[24px] bg-white p-6">
            <h2 className="text-lg font-bold">Oferecer Sessão Acadêmica</h2>
            <form onSubmit={handleCriarMentoria} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select value={tipoSessao} onChange={e => setTipoSessao(e.target.value)} className="rounded-xl border p-3 text-xs">
                  <option value="Mentoria">Mentoria Individual</option>
                  <option value="Palestra">Palestra / Roda de Conversa</option>
                  <option value="Workshop">Workshop Prático</option>
                </select>
                <select value={modalidadeSessao} onChange={e => setModalidadeSessao(e.target.value as any)} className="rounded-xl border p-3 text-xs font-bold text-[#173F32]">
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="SEMIPRESENCIAL">Semipresencial</option>
                  <option value="REMOTO">Remoto</option>
                </select>
              </div>

              {(modalidadeSessao === 'PRESENCIAL' || modalidadeSessao === 'SEMIPRESENCIAL') && (
                <input required placeholder="Local (ex: Auditório Central ou Lab 03)" value={localSessao}
                  onChange={e => setLocalSessao(e.target.value)} className="w-full rounded-xl border border-[#4F836F] bg-[#F7F8F5] p-3 text-xs" />
              )}
              {(modalidadeSessao === 'REMOTO' || modalidadeSessao === 'SEMIPRESENCIAL') && (
                <input required={modalidadeSessao === 'REMOTO'} placeholder="Link da Transmissão (Meet / YouTube / Zoom)" value={linkSessao}
                  onChange={e => setLinkSessao(e.target.value)} className="w-full rounded-xl border border-[#4F836F] bg-[#F7F8F5] p-3 text-xs" />
              )}

              <input required placeholder="Tema (ex: Introdução a APIs com Python)" value={areaSessao} onChange={e => setAreaSessao(e.target.value)} className="w-full rounded-xl border p-3 text-xs" />

              <div className="flex gap-2">
                <input required placeholder="Data e horário (ex: Quinta, 19:00)" value={horarioSessao} onChange={e => setHorarioSessao(e.target.value)} className="flex-1 rounded-xl border p-3 text-xs" />
                {tipoSessao !== 'Mentoria' && (
                  <input required type="number" min={2} max={200} title="Limite de vagas" placeholder="Vagas" value={capacidadeSessao}
                    onChange={e => setCapacidadeSessao(Number(e.target.value))} className="w-24 rounded-xl border p-3 text-xs" />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setModalNovaMentoria(false)} className="px-4 py-2 text-xs font-bold text-gray-500">Cancelar</button>
                <button type="submit" className="rounded-xl bg-[#173F32] px-4 py-2 text-xs font-bold text-white">Publicar Sessão</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerenciar Palestra / Mentoria + Lista de Presença */}
      {mentoriaGerenciando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
          <div className="animate-modal my-8 w-full max-w-2xl rounded-[24px] bg-white p-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold">Gerenciar Sessão & Lista de Presença</h2>
              <button onClick={() => setMentoriaGerenciando(null)} className="text-sm font-bold text-gray-400">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <form onSubmit={e => handleSalvarGerenciamentoMentoria(e)} className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase text-[#4F836F]">Configurações da Sessão</h3>
                <div className="grid grid-cols-2 gap-2">
                  <select value={editMentTipo} onChange={e => setEditMentTipo(e.target.value)} className="rounded-xl border p-2.5 text-xs">
                    <option value="Mentoria">Mentoria</option>
                    <option value="Palestra">Palestra</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                  <select value={editMentModalidade} onChange={e => setEditMentModalidade(e.target.value as any)} className="rounded-xl border p-2.5 text-xs font-bold">
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="SEMIPRESENCIAL">Semipresencial</option>
                    <option value="REMOTO">Remoto</option>
                  </select>
                </div>

                {(editMentModalidade === 'PRESENCIAL' || editMentModalidade === 'SEMIPRESENCIAL') && (
                  <input placeholder="Local na Instituição" value={editMentLocal} onChange={e => setEditMentLocal(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs" />
                )}
                {(editMentModalidade === 'REMOTO' || editMentModalidade === 'SEMIPRESENCIAL') && (
                  <input placeholder="Link da Reunião" value={editMentLink} onChange={e => setEditMentLink(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs" />
                )}

                <input required placeholder="Tema" value={editMentArea} onChange={e => setEditMentArea(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs" />

                <div className="flex gap-2">
                  <input required placeholder="Data e Horário" value={editMentHorario} onChange={e => setEditMentHorario(e.target.value)} className="flex-1 rounded-xl border p-2.5 text-xs" />
                  {editMentTipo !== 'Mentoria' && (
                    <input required type="number" min={1} max={200} value={editMentCapacidade} onChange={e => setEditMentCapacidade(Number(e.target.value))} className="w-20 rounded-xl border p-2.5 text-xs" />
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={e => handleSalvarGerenciamentoMentoria(e, 'ADIADA')}
                    className="flex-1 rounded-xl bg-amber-100 py-2 text-xs font-extrabold text-amber-900">
                    Adiar / Remarcar
                  </button>
                  <button type="button" onClick={e => handleSalvarGerenciamentoMentoria(e, 'CANCELADA')}
                    className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-extrabold text-red-600">
                    Cancelar
                  </button>
                </div>

                <button type="submit" onClick={() => setEditMentStatus('AGENDADA')}
                  className="w-full rounded-xl bg-[#173F32] py-2.5 text-xs font-bold text-white">
                  Salvar como Confirmada
                </button>
              </form>

              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase text-[#4F836F]">
                  Inscritos ({mentoriaGerenciando.inscritos.length} / {mentoriaGerenciando.capacidade})
                </h3>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {mentoriaGerenciando.inscritos.length === 0 && (
                    <p className="text-xs text-gray-400">Nenhum aluno inscrito ainda.</p>
                  )}
                  {mentoriaGerenciando.inscritos.map(insc => (
                    <div key={insc.id} className="flex items-center justify-between rounded-xl border bg-[#F7F8F5] p-3 text-xs">
                      <div>
                        <strong className="block">{insc.usuario_nome}</strong>
                        <span className="text-[10px] text-gray-500">{insc.usuario_curso}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTogglePresenca(insc.id, !insc.presente)}
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition ${
                          insc.presente ? 'bg-[#E4FF73] text-[#173F32]' : 'border border-gray-300 bg-white text-gray-600'
                        }`}
                      >
                        {insc.presente ? '✓ Presente' : 'Validar Presença'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}