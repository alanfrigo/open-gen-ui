'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Download,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Loader2,
  Menu,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  Paperclip,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Video,
  WandSparkles,
  X,
  Zap,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { createAuthClient } from 'better-auth/react';
import {
  initialWorkspace,
  starterModels,
  type Workspace,
  type Media,
  type Model,
  type Assistant,
} from '@/lib/types';
const authClient = createAuthClient();
const inspirations = [
  {
    title: 'O extraordinário no cotidiano',
    tag: 'FOTOGRAFIA',
    className: 'still',
    prompt:
      'Fotografia editorial de uma laranja sobre tecido azul cobalto, luz direta do sol, sombras gráficas, composição minimalista, textura analógica.',
    image:
      'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=700&q=85',
  },
  {
    title: 'Um mundo que só você imaginou',
    tag: 'DIREÇÃO DE ARTE',
    className: 'landscape',
    prompt:
      'Uma pequena casa brutalista em uma paisagem desértica surreal, dunas rosadas, céu azul suave, luz cinematográfica ao entardecer.',
    image:
      'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=700&q=85',
  },
  {
    title: 'Ideias que ganham movimento',
    tag: 'VÍDEO',
    className: 'motion',
    prompt:
      'Plano cinematográfico de ondas do mar, câmera em travelling lento sobre a água, reflexos dourados do pôr do sol, movimento natural e atmosfera contemplativa.',
    image:
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=700&q=85',
  },
];
async function request(path: string, body?: unknown, method = 'POST') {
  const r = await fetch(
    path,
    body === undefined
      ? undefined
      : {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
  );
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Não foi possível concluir.');
  return d;
}
function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-symbol ${small ? 'small' : ''}`}>
      <Layers size={small ? 17 : 23} />
    </span>
  );
}
function Provider({ name }: { name: string }) {
  return (
    <span
      className={`provider ${name.toLowerCase().includes('google') ? 'google' : ''}`}
    >
      {name.toLowerCase().includes('google')
        ? '✦'
        : name.toLowerCase().includes('openai')
          ? '◎'
          : '↗'}
    </span>
  );
}
export default function Studio() {
  const [view, setView] = useState('studio');
  const [ws, setWs] = useState<Workspace>(initialWorkspace);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<{ name: string; id: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [kind, setKind] = useState<'image' | 'video'>('image');
  const [models, setModels] = useState<Model[]>(starterModels);
  const [model, setModel] = useState(starterModels[0]);
  const [ratio, setRatio] = useState('1:1');
  const [refs, setRefs] = useState<Media[]>([]);
  const [activeProject, setActiveProject] = useState('');
  const [activeAssistant, setActiveAssistant] = useState('creative');
  const [busy, setBusy] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState('');
  const [search, setSearch] = useState('');
  const [sidebar, setSidebar] = useState(false);
  const [selected, setSelected] = useState<Media | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const fileRef = useRef<HTMLInputElement>(null);
  const skillRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const session = await authClient.getSession();
        if (!live) return;
        if (session.data?.user) {
          const data = await request('/api/workspace');
          setWs(data);
          setUser(session.data.user);
        } else {
          const saved = localStorage.getItem('opengenui-demo');
          if (saved)
            setWs({ ...initialWorkspace, ...JSON.parse(saved), media: [] });
        }
      } catch {
        setError(
          'Não foi possível restaurar sua conta. Tente atualizar a página.',
        );
      } finally {
        if (live) setReady(true);
      }
    })();
    request('/api/models')
      .then((data) => {
        if (live && data.length) {
          setModels(data);
          setModel(data.find((m: Model) => m.kind === 'image') || data[0]);
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (user)
        request('/api/workspace', ws, 'PUT').catch((e) =>
          setError(`Falha ao salvar: ${e.message}`),
        );
      else
        try {
          localStorage.setItem(
            'opengenui-demo',
            JSON.stringify({ ...ws, media: [] }),
          );
        } catch {
          setError('O armazenamento local está cheio.');
        }
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [ws, ready, user]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setView('studio');
        promptRef.current?.focus();
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!modal && !selected) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector('[role=dialog]');
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,textarea,select',
        ) || [],
      );
    focusable()[0]?.focus();
    const listener = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const items = focusable();
        if (e.shiftKey && document.activeElement === items[0]) {
          e.preventDefault();
          items.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
          e.preventDefault();
          items[0]?.focus();
        }
      }
      if (e.key === 'Escape') {
        setModal('');
        setSelected(null);
      }
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
      previous?.focus();
    };
  }, [modal, selected]);
  function navigate(v: string) {
    setView(v);
    setSidebar(false);
    setSearch('');
  }
  function switchKind(k: 'image' | 'video') {
    setKind(k);
    setModel(
      models.find((m) => m.kind === k) ||
        starterModels.find((m) => m.kind === k)!,
    );
    setRatio(k === 'video' ? '16:9' : '1:1');
  }
  async function upload(files: FileList | null) {
    if (!files) return;
    setError('');
    for (const f of Array.from(files).slice(0, 4 - refs.length)) {
      if (
        !['image/png', 'image/jpeg', 'image/webp'].includes(f.type) ||
        f.size > 20 * 1024 * 1024
      ) {
        setError('Use imagens PNG, JPG ou WebP de até 20 MB.');
        continue;
      }
      try {
        let media: Media;
        if (user) {
          const form = new FormData();
          form.append('file', f);
          form.append('projectId', activeProject);
          const r = await fetch('/api/upload', { method: 'POST', body: form });
          media = await r.json();
          if (!r.ok)
            throw new Error((media as unknown as { error: string }).error);
        } else {
          media = {
            id: crypto.randomUUID(),
            name: f.name,
            kind: 'image',
            url: URL.createObjectURL(f),
            projectId: activeProject,
          };
        }
        setRefs((prev) => [...prev, media].slice(0, 4));
        setWs((w) => ({ ...w, media: [media, ...w.media] }));
      } catch (e) {
        setError((e as Error).message);
      }
    }
  }
  async function enhance() {
    if (!prompt.trim()) return;
    if (!user) {
      setModal('auth');
      return;
    }
    setEnhancing(true);
    setError('');
    try {
      await request('/api/workspace', ws, 'PUT');
      const r = await request('/api/enhance', {
        prompt,
        kind,
        assistantId: activeAssistant,
      });
      if (typeof r.prompt === 'string') setPrompt(r.prompt);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnhancing(false);
    }
  }
  async function generate() {
    if (!prompt.trim() || busy) return;
    if (!user) {
      setModal('auth');
      return;
    }
    setBusy(true);
    setError('');
    const input = prompt;
    try {
      await request('/api/workspace', ws, 'PUT');
      const result = await request('/api/generate', {
        prompt: input,
        kind,
        model: model.id,
        aspectRatio: ratio,
        references: refs.map((r) => r.id),
        assistantId: activeAssistant,
        projectId: activeProject || undefined,
      });
      setWs((w) => ({
        ...w,
        messages: [
          ...w.messages,
          { id: crypto.randomUUID(), role: 'user', content: input },
        ],
      }));
      setPrompt('');
      setRefs([]);
      let media: Media[] = result.media || [];
      if (result.jobId) {
        setNotice('Vídeo enviado. Você pode acompanhar o processamento aqui.');
        localStorage.setItem('opengenui-pending-job', result.jobId);
        let completed = false;
        for (let i = 0; i < 120; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          const state = await request(`/api/jobs/${result.jobId}`);
          if (state.status === 'completed') {
            media = state.media;
            completed = true;
            localStorage.removeItem('opengenui-pending-job');
            break;
          }
          if (['failed', 'cancelled', 'expired'].includes(state.status)) {
            localStorage.removeItem('opengenui-pending-job');
            throw new Error(state.error || 'A geração não foi concluída.');
          }
        }
        if (!completed)
          throw new Error(
            'O vídeo continua processando. Use “Retomar vídeo” na biblioteca.',
          );
      }
      setWs((w) => ({
        ...w,
        media: [
          ...media,
          ...w.media.filter((m) => !media.some((n) => n.id === m.id)),
        ],
        messages: [
          ...w.messages,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Pronto. Sua ideia ganhou forma.',
            media,
          },
        ],
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function resume() {
    const id = localStorage.getItem('opengenui-pending-job');
    if (!id) {
      setNotice('Nenhum vídeo pendente neste navegador.');
      return;
    }
    try {
      const s = await request(`/api/jobs/${id}`);
      if (s.status === 'completed') {
        setWs((w) => ({
          ...w,
          media: [
            ...s.media,
            ...w.media.filter(
              (m) => !s.media.some((n: Media) => n.id === m.id),
            ),
          ],
        }));
        localStorage.removeItem('opengenui-pending-job');
        setNotice('Vídeo salvo na biblioteca.');
      } else setNotice(`Status: ${s.status}. Consulte novamente em instantes.`);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function importSkill(file: File) {
    if (file.size > 50000) {
      setError('Use um SKILL.md de até 50 KB.');
      return;
    }
    const content = await file.text();
    const name =
      content.match(/^name:\s*(.+)$/m)?.[1]?.replace(/["']/g, '') ||
      file.name.replace('.md', '');
    setWs((w) => ({
      ...w,
      skills: [...w.skills, { id: crypto.randomUUID(), name, content }],
    }));
    setNotice('Skill adicionada. Vincule-a a um assistente.');
  }
  const filteredMedia = ws.media.filter(
    (m) =>
      (!activeProject || m.projectId === activeProject) &&
      m.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebar ? 'open' : ''}`}>
        <a href="/" className="brand">
          <Brand />
          <span>
            OpenGen<span className="brand-ui">UI</span>
          </span>
          <span className="alpha">ALPHA</span>
        </a>
        <button className="workspace-switch" onClick={() => setModal('auth')}>
          <span className="workspace-avatar">O</span>
          <span>
            Meu workspace<small>{user ? user.name : 'Workspace pessoal'}</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <button
          className="new-chat"
          onClick={() => {
            navigate('studio');
            setWs((w) => ({ ...w, messages: [] }));
            setPrompt('');
            setRefs([]);
          }}
        >
          <Plus size={17} /> Nova criação <span>⌘ K</span>
        </button>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {[
            { id: 'studio', label: 'Estúdio', icon: Sparkles },
            { id: 'library', label: 'Biblioteca', icon: LayoutGrid },
            { id: 'assistants', label: 'Assistentes', icon: Box },
            { id: 'skills', label: 'Skills', icon: Zap },
          ].map((n) => (
            <button
              key={n.id}
              className={view === n.id ? 'active' : ''}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={18} />
              {n.label}
              {n.id === 'library' && ws.media.length > 0 && (
                <span className="count">{ws.media.length}</span>
              )}
              {n.id === 'studio' && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="nav-caption projects-caption">
          PROJETOS
          <button
            aria-label="Criar projeto"
            onClick={() => setModal('project')}
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="project-list">
          {ws.projects.length ? (
            ws.projects.map((p) => (
              <button
                key={p.id}
                className={activeProject === p.id ? 'selected-project' : ''}
                onClick={() => {
                  setActiveProject(p.id);
                  navigate('library');
                }}
              >
                <Folder size={16} />
                <span>{p.name}</span>
              </button>
            ))
          ) : (
            <button onClick={() => setModal('project')}>
              <FolderPlus size={16} />
              <span>Criar meu primeiro projeto</span>
            </button>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="open-source">
            <span className="source-mark">↗</span>
            <strong>Feito para ser seu.</strong>
            <p>
              Open source. Sem limites
              <br />
              para a sua imaginação.
            </p>
            <a
              href="https://github.com/topics/opengenui"
              target="_blank"
              rel="noreferrer"
            >
              Explore o open source <ArrowUpRight size={13} />
            </a>
          </div>
          <button className="user-button" onClick={() => setModal('settings')}>
            <span className="avatar">
              {user ? user.name.slice(0, 2).toUpperCase() : 'OG'}
            </span>
            <span>
              {user ? user.name : 'Seu espaço criativo'}
              <small>{user ? 'Conta conectada' : 'Modo demonstração'}</small>
            </span>
            <Settings2 size={17} />
          </button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <button
              className="mobile-toggle"
              aria-label="Abrir menu"
              onClick={() => setSidebar(!sidebar)}
            >
              <Menu size={19} />
            </button>
            <span className="breadcrumb">Workspace pessoal</span>
            <ChevronRight size={13} />
            <span>
              {
                (
                  {
                    studio: 'Estúdio',
                    library: 'Biblioteca',
                    assistants: 'Assistentes',
                    skills: 'Skills',
                  } as Record<string, string>
                )[view]
              }
            </span>
            {activeProject && (
              <button
                className="project-chip"
                onClick={() => setActiveProject('')}
              >
                {ws.projects.find((p) => p.id === activeProject)?.name}
                <X size={12} />
              </button>
            )}
          </div>
          <div>
            <span className="connection">
              <i />
              {user ? 'Conta conectada' : 'Prévia local'}
            </span>
            <button
              className="icon-button"
              aria-label="Configurações"
              onClick={() => setModal('settings')}
            >
              <SlidersHorizontal size={17} />
            </button>
          </div>
        </header>
        {(error || notice) && (
          <div
            className={`toast ${error ? 'error' : ''}`}
            role={error ? 'alert' : 'status'}
          >
            {error || notice}
            <button
              aria-label="Fechar aviso"
              onClick={() => {
                setError('');
                setNotice('');
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {view === 'studio' ? (
          <div className={`studio ${ws.messages.length ? 'has-messages' : ''}`}>
            {!ws.messages.length ? (
              <>
                <div className="intro">
                  <div className="eyebrow">
                    <span /> SEU ESTÚDIO CRIATIVO, REIMAGINADO
                  </div>
                  <h1>
                    Da sua imaginação.
                    <br />
                    <span>Para o mundo.</span>
                  </h1>
                  <p>
                    Transforme ideias em imagens e vídeos extraordinários.
                    <br className="desktop-break" /> Uma conversa é tudo que
                    você precisa para começar.
                  </p>
                </div>
                <div className="creation-tabs">
                  <button
                    className={kind === 'image' ? 'active' : ''}
                    onClick={() => switchKind('image')}
                  >
                    <ImageIcon size={16} />
                    Criar imagem
                  </button>
                  <button
                    className={kind === 'video' ? 'active' : ''}
                    onClick={() => switchKind('video')}
                  >
                    <Video size={17} />
                    Criar vídeo<span className="new-badge">NOVO</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="messages">
                {ws.messages.map((m) => (
                  <div key={m.id} className={`message ${m.role}`}>
                    <span className="message-avatar">
                      {m.role === 'assistant' ? <Brand small /> : 'Você'}
                    </span>
                    <div>
                      <p>{m.content}</p>
                      {m.media && (
                        <div className="message-media">
                          {m.media.map((a) => (
                            <button key={a.id} onClick={() => setSelected(a)}>
                              {a.kind === 'image' ? (
                                <img src={a.url} alt={a.name} />
                              ) : (
                                <video src={a.url} controls />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {busy && (
                  <div className="generating">
                    <Loader2 size={17} className="spin" />
                    <span>Dando forma à sua ideia…</span>
                  </div>
                )}
              </div>
            )}
            <div className="composer-wrap">
              <div
                className="composer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void upload(e.dataTransfer.files);
                }}
              >
                <div className="composer-context">
                  <button onClick={() => setModal('pick-assistant')}>
                    <span className="tiny-spark">✦</span>
                    {ws.assistants.find((a) => a.id === activeAssistant)
                      ?.name || 'Sem assistente'}
                    <ChevronDown size={12} />
                  </button>
                  <span>{kind === 'image' ? 'IMAGEM' : 'VÍDEO'}</span>
                </div>
                {refs.length > 0 && (
                  <div className="references">
                    {refs.map((r) => (
                      <div key={r.id}>
                        <img src={r.url} alt={r.name} />
                        <span>{r.name}</span>
                        <button
                          aria-label={`Remover ${r.name}`}
                          onClick={() =>
                            setRefs((prev) => prev.filter((p) => p.id !== r.id))
                          }
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  ref={promptRef}
                  aria-label="Descreva sua criação"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void generate();
                    }
                  }}
                  placeholder={
                    kind === 'image'
                      ? 'Uma ideia, uma cena, um mundo inteiro. O que vamos criar?'
                      : 'Descreva a cena, o movimento e a história que você quer contar…'
                  }
                />
                <div className="composer-actions">
                  <div>
                    <button
                      className="attach"
                      title="Anexar referências"
                      aria-label="Anexar referências"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Plus size={20} />
                    </button>
                    <span className="divider" />
                    <button
                      className="model-picker"
                      onClick={() => {
                        setSearch('');
                        setModal('models');
                      }}
                    >
                      <Provider name={model.provider} />
                      <span>{model.name}</span>
                      <ChevronDown size={12} />
                    </button>
                    <select
                      aria-label="Proporção"
                      value={ratio}
                      onChange={(e) => setRatio(e.target.value)}
                    >
                      <option>1:1</option>
                      <option>16:9</option>
                      <option>9:16</option>
                    </select>
                  </div>
                  <div>
                    <button
                      className="enhance"
                      disabled={!prompt.trim() || enhancing || busy}
                      title="Melhorar prompt"
                      onClick={enhance}
                    >
                      {enhancing ? (
                        <Loader2 className="spin" size={16} />
                      ) : (
                        <WandSparkles size={16} />
                      )}
                      <span>Melhorar</span>
                    </button>
                    <button
                      className="send"
                      disabled={!prompt.trim() || busy || !ready}
                      aria-label="Gerar mídia"
                      onClick={generate}
                    >
                      {busy ? (
                        <Loader2 className="spin" size={19} />
                      ) : (
                        <ArrowUp size={21} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="composer-foot">
                <span>
                  <Paperclip size={12} /> Arraste imagens para usar como
                  referência
                </span>
                <span>⌘ Enter para criar</span>
              </div>
            </div>
            {!ws.messages.length && (
              <section className="inspiration">
                <div className="section-label">
                  <span>UM POUCO DE INSPIRAÇÃO</span>
                  <span>Grandes ideias começam com um “e se…”</span>
                </div>
                <div className="inspiration-grid">
                  {inspirations.map((card, i) => (
                    <button
                      key={card.title}
                      className={`inspiration-card ${card.className}`}
                      onClick={() => {
                        switchKind(i === 2 ? 'video' : 'image');
                        setPrompt(card.prompt);
                        promptRef.current?.focus();
                      }}
                    >
                      <img src={card.image} alt="" />
                      <div className="card-shade" />
                      <div className="card-top">
                        <span>{card.tag}</span>
                        {i === 2 ? (
                          <Video size={15} />
                        ) : (
                          <ImageIcon size={15} />
                        )}
                      </div>
                      <div className="card-bottom">
                        <strong>{card.title}</strong>
                        <span>
                          Experimentar prompt <ArrowUpRight size={14} />
                        </span>
                      </div>
                      {i === 2 && <span className="play-circle">▶</span>}
                    </button>
                  ))}
                </div>
                <p className="inspiration-note">
                  Fotografias de inspiração · clique para experimentar um prompt
                </p>
              </section>
            )}
            <footer className="studio-footer">
              <span className="footer-logo">✳</span> Criatividade humana.
              Possibilidades infinitas.
              <span className="footer-right">
                POWERED BY <strong>↗ OpenRouter</strong>
              </span>
            </footer>
          </div>
        ) : (
          <div className="content-page">
            <div className="page-heading">
              <div>
                <div className="eyebrow">SEU WORKSPACE</div>
                <h1>
                  {view === 'library'
                    ? 'Todas as suas ideias.'
                    : view === 'assistants'
                      ? 'Seu time criativo.'
                      : 'Novas possibilidades.'}
                </h1>
                <p>
                  {view === 'library'
                    ? 'Referências e criações, sempre ao seu alcance.'
                    : view === 'assistants'
                      ? 'Assistentes com a sua visão, seu estilo e suas skills.'
                      : 'Adicione conhecimento especializado aos seus assistentes.'}
                </p>
              </div>
              <button
                className="primary"
                onClick={() =>
                  view === 'library'
                    ? fileRef.current?.click()
                    : setModal(view === 'assistants' ? 'assistant' : 'skill')
                }
              >
                <Plus size={16} />
                {view === 'library'
                  ? 'Adicionar arquivo'
                  : view === 'assistants'
                    ? 'Criar assistente'
                    : 'Adicionar skill'}
              </button>
            </div>
            {view === 'library' ? (
              <>
                <div className="library-toolbar">
                  <label className="search-field">
                    <Search size={16} />
                    <input
                      placeholder="Buscar arquivos…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <button
                    className="secondary"
                    onClick={() => setModal('project')}
                  >
                    <FolderPlus size={15} />
                    Novo projeto
                  </button>
                  <button className="secondary" onClick={resume}>
                    Retomar vídeo
                  </button>
                </div>
                {ws.projects.length > 0 && (
                  <div className="project-pills">
                    <button
                      className={!activeProject ? 'active' : ''}
                      onClick={() => setActiveProject('')}
                    >
                      Todos
                    </button>
                    {ws.projects.map((p) => (
                      <button
                        className={activeProject === p.id ? 'active' : ''}
                        key={p.id}
                        onClick={() => setActiveProject(p.id)}
                      >
                        <Folder size={14} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
                {filteredMedia.length ? (
                  <div className="media-grid">
                    {filteredMedia.map((m) => (
                      <button
                        className="media-card"
                        key={m.id}
                        onClick={() => setSelected(m)}
                      >
                        {m.kind === 'image' ? (
                          <img src={m.url} alt={m.name} />
                        ) : (
                          <video src={m.url} />
                        )}
                        <div>
                          <span>{m.name}</span>
                          {m.kind === 'image' ? (
                            <ImageIcon size={15} />
                          ) : (
                            <Video size={15} />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty">
                    <Layers size={35} />
                    <h2>
                      {search
                        ? 'Nenhum arquivo encontrado'
                        : 'Seu próximo projeto começa aqui'}
                    </h2>
                    <p>Gere sua primeira imagem ou adicione uma referência.</p>
                    <button
                      className="secondary"
                      onClick={() => navigate('studio')}
                    >
                      Ir para o estúdio <ArrowUpRight size={15} />
                    </button>
                  </div>
                )}
              </>
            ) : view === 'assistants' ? (
              <div className="entity-grid">
                {ws.assistants.map((a) => (
                  <button
                    className="entity-card"
                    key={a.id}
                    onClick={() => {
                      setActiveAssistant(a.id);
                      setModal('edit-assistant');
                    }}
                  >
                    <span className="entity-icon">
                      <Sparkles size={24} />
                    </span>
                    <MoreHorizontal size={19} className="entity-more" />
                    <h3>{a.name}</h3>
                    <p>{a.description}</p>
                    <span className="entity-foot">
                      {a.skills.length} skills vinculadas{' '}
                      <ArrowUpRight size={14} />
                    </span>
                  </button>
                ))}
                <button
                  className="entity-card add-card"
                  onClick={() => setModal('assistant')}
                >
                  <Plus size={25} />
                  <h3>Crie do seu jeito</h3>
                  <p>Dê personalidade ao seu próximo assistente.</p>
                </button>
              </div>
            ) : (
              <>
                <a
                  className="skills-banner"
                  href="https://skills.sh"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Zap size={25} />
                  <div>
                    <strong>Explore o ecossistema skills.sh</strong>
                    <p>
                      Encontre uma skill e importe o SKILL.md do repositório.
                    </p>
                  </div>
                  <ArrowUpRight size={20} />
                </a>
                <div className="entity-grid">
                  {ws.skills.map((s) => (
                    <div className="entity-card" key={s.id}>
                      <BookOpen size={25} />
                      <h3>{s.name}</h3>
                      <p>{s.content.slice(0, 120)}</p>
                      <span className="entity-foot">
                        Instruções para assistentes
                        <button
                          aria-label={`Excluir ${s.name}`}
                          onClick={() =>
                            setWs((w) => ({
                              ...w,
                              skills: w.skills.filter((x) => x.id !== s.id),
                              assistants: w.assistants.map((a) => ({
                                ...a,
                                skills: a.skills.filter((id) => id !== s.id),
                              })),
                            }))
                          }
                        >
                          <X size={14} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
                {!ws.skills.length && (
                  <div className="empty">
                    <Zap size={35} />
                    <h2>Um novo talento para cada ideia</h2>
                    <p>Importe um SKILL.md ou envie sua própria skill.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
      <input
        hidden
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={(e) => {
          void upload(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        hidden
        ref={skillRef}
        type="file"
        accept=".md"
        onChange={(e) => {
          if (e.target.files?.[0]) void importSkill(e.target.files[0]);
          e.target.value = '';
        }}
      />
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal('')}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Configuração do workspace"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Fechar"
              onClick={() => setModal('')}
            >
              <X size={19} />
            </button>
            {modal === 'models' ? (
              <>
                <div className="eyebrow">OPENROUTER</div>
                <h2>Escolha seu modelo</h2>
                <p>Um modelo para cada possibilidade.</p>
                <label className="search-field">
                  <Search size={17} />
                  <input
                    autoFocus
                    placeholder="Buscar modelos…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <div className="model-list">
                  {models
                    .filter(
                      (m) =>
                        m.kind === kind &&
                        m.name.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setModel(m);
                          setModal('');
                          setSearch('');
                        }}
                      >
                        <Provider name={m.provider} />
                        <span>
                          {m.name}
                          <small>{m.provider}</small>
                        </span>
                        {model.id === m.id ? (
                          <Check size={17} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    ))}
                </div>
                <small className="muted">
                  {user
                    ? 'Disponibilidade e valores definidos pelo OpenRouter.'
                    : 'Catálogo de exemplo até configurar o OpenRouter.'}
                </small>
              </>
            ) : modal === 'pick-assistant' ? (
              <>
                <h2>Com quem vamos criar?</h2>
                <div className="model-list">
                  {ws.assistants.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setActiveAssistant(a.id);
                        setModal('');
                      }}
                    >
                      <Sparkles size={20} />
                      <span>
                        {a.name}
                        <small>{a.description}</small>
                      </span>
                      {activeAssistant === a.id && <Check size={17} />}
                    </button>
                  ))}
                </div>
                <button
                  className="secondary"
                  onClick={() => setModal('assistant')}
                >
                  <Plus size={16} />
                  Criar assistente
                </button>
              </>
            ) : modal === 'project' ? (
              <>
                <h2>Um lugar para sua ideia</h2>
                <p>Organize as referências e criações de um projeto.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const id = crypto.randomUUID();
                    setWs((w) => ({
                      ...w,
                      projects: [
                        ...w.projects,
                        {
                          id,
                          name: String(f.get('name')),
                          description: String(f.get('description')),
                        },
                      ],
                    }));
                    setActiveProject(id);
                    setModal('');
                    setNotice(
                      'Projeto criado. Novas criações serão salvas nele.',
                    );
                  }}
                >
                  <label>
                    Nome do projeto
                    <input
                      name="name"
                      autoFocus
                      required
                      maxLength={100}
                      placeholder="Ex.: Campanha de verão"
                    />
                  </label>
                  <label>
                    Descrição
                    <textarea
                      name="description"
                      maxLength={500}
                      placeholder="O que vamos criar?"
                    />
                  </label>
                  <button className="primary">
                    Criar projeto <ArrowUpRight size={16} />
                  </button>
                </form>
              </>
            ) : modal === 'assistant' || modal === 'edit-assistant' ? (
              <AssistantForm
                assistant={
                  modal === 'edit-assistant'
                    ? ws.assistants.find((a) => a.id === activeAssistant)
                    : undefined
                }
                ws={ws}
                onSave={(a) => {
                  setWs((w) => ({
                    ...w,
                    assistants: [
                      ...w.assistants.filter((x) => x.id !== a.id),
                      a,
                    ],
                  }));
                  setActiveAssistant(a.id);
                  setModal('');
                  setNotice('Assistente salvo.');
                }}
              />
            ) : modal === 'skill' ? (
              <>
                <h2>Adicione uma skill</h2>
                <p>
                  Importe instruções. Scripts e arquivos auxiliares não são
                  executados nesta versão.
                </p>
                <button
                  className="upload-skill"
                  onClick={() => {
                    skillRef.current?.click();
                    setModal('');
                  }}
                >
                  <BookOpen size={25} />
                  <strong>Enviar SKILL.md</strong>
                  <span>Markdown · até 50 KB</span>
                </button>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    try {
                      const skill = await request('/api/skills/import', {
                        url: f.get('url'),
                      });
                      setWs((w) => ({ ...w, skills: [...w.skills, skill] }));
                      setModal('');
                      setNotice(
                        'Skill importada. Vincule-a ao seu assistente.',
                      );
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <label>
                    URL raw do SKILL.md
                    <input
                      name="url"
                      type="url"
                      required
                      placeholder="https://raw.githubusercontent.com/…/SKILL.md"
                    />
                  </label>
                  <button className="primary">
                    Importar do repositório <ArrowUpRight size={15} />
                  </button>
                </form>
              </>
            ) : modal === 'auth' ? (
              <>
                <Brand />
                <h2>
                  {authMode === 'signin'
                    ? 'Entre no seu espaço.'
                    : 'Sua criatividade mora aqui.'}
                </h2>
                <p>
                  Salve seus projetos e gere mídia com o OpenRouter configurado
                  no servidor.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    setBusy(true);
                    try {
                      const credentials = {
                        email: String(f.get('email')),
                        password: String(f.get('password')),
                      };
                      const result =
                        authMode === 'signin'
                          ? await authClient.signIn.email(credentials)
                          : await authClient.signUp.email({
                              ...credentials,
                              name: String(f.get('name')),
                            });
                      if (result.error)
                        throw new Error(
                          result.error.message || 'Não foi possível entrar.',
                        );
                      const session = await authClient.getSession();
                      if (session.data?.user) {
                        const data = await request('/api/workspace');
                        setUser(session.data.user);
                        setWs(data);
                        setModal('');
                        setNotice('Conta conectada.');
                      }
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {authMode === 'signup' && (
                    <label>
                      Seu nome
                      <input name="name" required autoComplete="name" />
                    </label>
                  )}
                  <label>
                    E-mail
                    <input
                      name="email"
                      required
                      type="email"
                      autoComplete="email"
                    />
                  </label>
                  <label>
                    Senha
                    <input
                      name="password"
                      required
                      type="password"
                      minLength={10}
                      autoComplete={
                        authMode === 'signin'
                          ? 'current-password'
                          : 'new-password'
                      }
                    />
                  </label>
                  <button className="primary" disabled={busy}>
                    {busy ? (
                      <Loader2 className="spin" size={16} />
                    ) : authMode === 'signin' ? (
                      'Entrar'
                    ) : (
                      'Criar conta'
                    )}
                  </button>
                </form>
                <button
                  className="text-button"
                  onClick={() =>
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
                  }
                >
                  {authMode === 'signin'
                    ? 'Ainda não tem conta? Crie a sua'
                    : 'Já tem conta? Entre'}
                </button>
              </>
            ) : (
              <>
                <h2>Seu workspace</h2>
                <p>
                  {user
                    ? 'Sua conta está conectada.'
                    : 'Você está explorando uma prévia local.'}
                </p>
                <div className="settings-row">
                  <span>Provedor de geração</span>
                  <strong>↗ OpenRouter</strong>
                </div>
                <div className="settings-row">
                  <span>Armazenamento</span>
                  <strong>
                    {user ? 'S3 compatível / R2' : 'Temporário no navegador'}
                  </strong>
                </div>
                <p className="settings-note">
                  Configure as credenciais no arquivo .env.local do servidor. A
                  chave OpenRouter nunca é enviada ao navegador.
                </p>
                <button
                  className="primary"
                  onClick={async () => {
                    if (user) {
                      await authClient.signOut();
                      setUser(null);
                      setWs(initialWorkspace);
                      setModal('');
                    } else setModal('auth');
                  }}
                >
                  {user ? (
                    <>
                      <LogOut size={16} />
                      Sair da conta
                    </>
                  ) : (
                    'Conectar minha conta'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div
            className="asset-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Editar mídia"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="asset-preview">
              {selected.kind === 'image' ? (
                <img src={selected.url} alt={selected.name} />
              ) : (
                <video src={selected.url} controls />
              )}
            </div>
            <div className="asset-details">
              <button
                className="modal-close icon-button"
                aria-label="Fechar"
                onClick={() => setSelected(null)}
              >
                <X size={18} />
              </button>
              <div className="eyebrow">SUA CRIAÇÃO</div>
              <h2>{selected.name}</h2>
              <p>{selected.prompt || 'Referência adicionada à biblioteca.'}</p>
              <label>
                O que você quer mudar?
                <textarea
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  placeholder={
                    selected.kind === 'image'
                      ? 'Ex.: Troque o fundo por um cenário noturno.'
                      : 'Ex.: Recrie a cena com movimento de câmera mais lento.'
                  }
                />
              </label>
              <button
                className="primary"
                disabled={!editInstruction.trim()}
                onClick={() => {
                  setPrompt(
                    `${selected.prompt || ''}\n${editInstruction}`.trim(),
                  );
                  switchKind(selected.kind);
                  setRefs(selected.kind === 'image' ? [selected] : []);
                  navigate('studio');
                  setSelected(null);
                  setEditInstruction('');
                  setNotice(
                    selected.kind === 'image'
                      ? 'Imagem anexada para edição. Revise o prompt e gere uma nova versão.'
                      : 'Prompt preparado para uma nova versão do vídeo.',
                  );
                }}
              >
                <WandSparkles size={16} />
                Preparar nova versão
              </button>
              {selected.kind === 'image' && (
                <button
                  className="secondary"
                  onClick={() => {
                    switchKind('video');
                    setRefs([selected]);
                    setPrompt(
                      'Anime esta imagem com movimento suave de câmera e luz natural.',
                    );
                    navigate('studio');
                    setSelected(null);
                  }}
                >
                  {' '}
                  <Video size={16} />
                  Transformar em vídeo
                </button>
              )}
              <a
                className="secondary"
                href={selected.url}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={16} />
                Abrir arquivo original
              </a>
              <small className="muted">
                {selected.kind === 'video'
                  ? 'Edição nesta versão: regeneração a partir do prompt.'
                  : 'Edição não destrutiva: o original permanece na biblioteca.'}
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function AssistantForm({
  assistant,
  ws,
  onSave,
}: {
  assistant?: Assistant;
  ws: Workspace;
  onSave: (a: Assistant) => void;
}) {
  return (
    <>
      <h2>
        {assistant
          ? 'Seu assistente, seu estilo.'
          : 'Conheça seu novo assistente.'}
      </h2>
      <p>Defina como ele pensa e o que sabe fazer.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          onSave({
            id: assistant?.id || crypto.randomUUID(),
            name: String(f.get('name')),
            description: String(f.get('description')),
            instructions: String(f.get('instructions')),
            skills: f.getAll('skills').map(String),
          });
        }}
      >
        <label>
          Nome
          <input
            autoFocus
            name="name"
            defaultValue={assistant?.name}
            required
            maxLength={100}
            placeholder="Ex.: Diretor de fotografia"
          />
        </label>
        <label>
          Descrição
          <input
            name="description"
            defaultValue={assistant?.description}
            maxLength={500}
            placeholder="Uma frase sobre sua especialidade"
          />
        </label>
        <label>
          Instruções
          <textarea
            name="instructions"
            defaultValue={assistant?.instructions}
            required
            maxLength={16000}
            placeholder="Como o assistente deve ajudar você?"
          />
        </label>
        <label>Skills</label>
        {ws.skills.length ? (
          ws.skills.map((s) => (
            <label className="checkbox-label" key={s.id}>
              <input
                type="checkbox"
                name="skills"
                value={s.id}
                defaultChecked={assistant?.skills.includes(s.id)}
              />
              {s.name}
            </label>
          ))
        ) : (
          <p className="muted">
            Adicione skills na aba Skills para vinculá-las aqui.
          </p>
        )}
        <button className="primary">
          Salvar assistente <Check size={16} />
        </button>
      </form>
    </>
  );
}
