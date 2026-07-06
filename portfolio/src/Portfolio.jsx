import { useState, useEffect, useRef, createContext, useContext } from "react";

// ---- 你的資料：之後改這裡就好 ----
const DEV = {
  name: "你的名字",
  role: "Frontend Developer",
  based: "Taiwan",
  photo: "", // ← 放你的照片網址，例如 "/me.jpg"；留空會顯示佔位
  stack: ["React", "TypeScript", "Node"],
  skills: {
    frontend: "React, TypeScript, Tailwind",
    backend: "Node, Express, PostgreSQL",
    tooling: "Git, Docker, Vite",
  },
};

const PROJECTS = [
  {
    id: "whiteboard",
    file: "whiteboard.jsx",
    name: "即時協作白板",
    emoji: "🎨",
    grad: "linear-gradient(135deg,#89b4fa44,#cba6f744)",
    tags: ["React", "WebSocket", "Canvas"],
    short: "多人同步繪圖 web app，WebSocket 即時同步，離線可編輯。",
    detail:
      "支援多位使用者同時在同一張畫布上繪圖。用 WebSocket 處理即時狀態同步，並以 CRDT 概念解決衝突，離線編輯後重新連線會自動合併。",
    role: "獨立開發 · 前後端",
    link: "github.com/yourname/whiteboard",
  },
  {
    id: "recipe-ai",
    file: "recipe-ai.jsx",
    name: "AI 食譜產生器",
    emoji: "🍳",
    grad: "linear-gradient(135deg,#a6e3a144,#fab38744)",
    tags: ["Next.js", "TypeScript", "LLM API"],
    short: "輸入現有食材自動生成食譜，含快取與串流回應。",
    detail:
      "輸入冰箱裡現有的食材，自動生成可行的食譜。串接 LLM API，做了回應串流（streaming）讓使用者即時看到結果，並用快取降低重複請求成本。",
    role: "獨立開發",
    link: "github.com/yourname/recipe-ai",
  },
  {
    id: "dashboard",
    file: "dashboard.jsx",
    name: "數據儀表板",
    emoji: "📊",
    grad: "linear-gradient(135deg,#f38ba844,#89dceb44)",
    tags: ["D3", "React", "Node"],
    short: "可自訂圖表儀表板，拖拉排版，即時資料串接。",
    detail:
      "可拖拉排版的數據儀表板，使用者能自由組合圖表。用 D3 繪製視覺化，後端以 Node 提供即時資料，支援自動刷新與匯出。",
    role: "團隊專案 · 負責前端",
    link: "github.com/yourname/dashboard",
  },
];

// ---- 語法高亮小工具 ----
const T = {
  kw: { color: "#cba6f7" }, str: { color: "#a6e3a1" }, fn: { color: "#89b4fa" },
  num: { color: "#fab387" }, cmt: { color: "#6c7086", fontStyle: "italic" },
  prop: { color: "#89dceb" }, txt: { color: "#cdd6f4" },
};

// ---- 響應式：偵測手機寬度 ----
const UI = createContext({ isMobile: false });

function useMediaQuery(query) {
  const [match, setMatch] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatch(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return match;
}

export default function Portfolio() {
  const [openFile, setOpenFile] = useState("projects");
  const [tabs, setTabs] = useState(["projects", "about"]);
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false); // 手機側邊抽屜

  const isMobile = useMediaQuery("(max-width: 768px)");

  const openTab = (id) => {
    setOpenFile(id);
    if (!tabs.includes(id)) setTabs([...tabs, id]);
    if (isMobile) setDrawerOpen(false); // 手機點檔案後收起抽屜
  };
  const closeTab = (id, e) => {
    e.stopPropagation();
    const next = tabs.filter((t) => t !== id);
    setTabs(next);
    if (openFile === id && next.length) setOpenFile(next[next.length - 1]);
  };

  const isProj = PROJECTS.some((p) => p.id === openFile);

  const appStyle = isMobile
    ? { ...S.app, display: "flex", flexDirection: "column", gridTemplateColumns: undefined }
    : S.app;

  const sideStyle = isMobile
    ? {
        ...S.side,
        position: "fixed",
        zIndex: 50,
        top: 0,
        left: 0,
        height: "100dvh",
        width: 250,
        transform: drawerOpen ? "translateX(0)" : "translateX(-105%)",
        transition: "transform .22s ease",
        boxShadow: drawerOpen ? "0 0 40px #000a" : "none",
        pointerEvents: drawerOpen ? "auto" : "none", // 關閉時不攔截點擊，保留滑出動畫
      }
    : S.side;

  // 內容區：桌面雙欄；手機一律單欄堆疊並整塊捲動
  const splitStyle = isMobile
    ? { ...S.split, display: "flex", flexDirection: "column", overflowY: "auto" }
    : { ...S.split, gridTemplateColumns: isProj ? "1fr" : "1fr 1fr" };

  return (
    <UI.Provider value={{ isMobile }}>
      <div style={appStyle}>
        {/* ---- 手機頂部列 ---- */}
        {isMobile && (
          <div style={S.mtop}>
            <button
              aria-label="開啟檔案總管"
              style={S.mBurger}
              onClick={() => setDrawerOpen((v) => !v)}
            >
              ☰
            </button>
            <span style={S.mTitle}>📂 your-name</span>
            <span style={S.mFile}>{fileNameOf(openFile)}</span>
          </div>
        )}

        {/* ---- 手機抽屜背景遮罩 ---- */}
        {isMobile && drawerOpen && (
          <div style={S.backdrop} onClick={() => setDrawerOpen(false)} />
        )}

        {/* ---- Explorer ---- */}
        <aside style={sideStyle}>
          <div style={S.root}>📂 your-name</div>
          <div style={S.sideTitle}>Explorer</div>
          <div style={S.folder} onClick={() => setFoldersOpen((v) => !v)}>
            <span style={{ color: "#6c7086" }}>{foldersOpen ? "▾" : "▸"}</span>📂 projects
          </div>
          {foldersOpen &&
            PROJECTS.map((p) => (
              <FileRow key={p.id} icon="⚛️" label={p.file} sub active={openFile === p.id} onClick={() => openTab(p.id)} />
            ))}
          <FileRow icon="📄" label="about.md" active={openFile === "about"} onClick={() => openTab("about")} />
          <FileRow icon="📬" label="contact.ts" active={openFile === "contact"} onClick={() => openTab("contact")} />
        </aside>

        {/* ---- Main ---- */}
        <div style={S.main}>
          {/* tabs */}
          <div style={S.tabs}>
            {tabs.map((id) => (
              <div key={id} style={{ ...S.tab, ...(openFile === id ? S.tabActive : {}) }} onClick={() => setOpenFile(id)}>
                <span>{fileNameOf(id)}</span>
                <span style={S.close} onClick={(e) => closeTab(id, e)}>×</span>
              </div>
            ))}
          </div>

          {/* content：作品→展示頁；about→照片；其他 code 頁→精選作品 */}
          <div style={splitStyle}>
            {isProj ? (
              <ProjectShowcase p={PROJECTS.find((p) => p.id === openFile)} onOpen={openTab} />
            ) : (
              <>
                <div style={{ ...S.codePane, ...(isMobile ? S.codePaneM : {}) }}>
                  <CodeView id={openFile} />
                </div>
                {openFile === "about" ? (
                  <AboutPhoto />
                ) : (
                  <div style={{ ...S.preview, ...(isMobile ? S.paneM : {}) }}>
                    <div style={S.phead}>◎ 精選作品</div>
                    {PROJECTS.map((p) => (
                      <PCard key={p.id} p={p} onClick={() => openTab(p.id)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* terminal */}
          <Terminal />
        </div>
      </div>
    </UI.Provider>
  );
}

function FileRow({ icon, label, sub, active, onClick }) {
  const [dot, ext] = splitExt(label);
  return (
    <div
      onClick={onClick}
      style={{
        ...S.file,
        paddingLeft: sub ? 44 : 30,
        background: active ? "#2a2a3c" : "transparent",
        borderLeft: active ? "2px solid #89b4fa" : "2px solid transparent",
      }}
      onMouseEnter={(e) => !active && (e.currentTarget.style.background = "#313244")}
      onMouseLeave={(e) => !active && (e.currentTarget.style.background = "transparent")}
    >
      {icon} {dot}<span style={{ color: "#6c7086" }}>{ext}</span>
    </div>
  );
}

function CodeView({ id }) {
  if (id === "about") return <AboutCode />;
  if (id === "contact") return <ContactCode />;
  return <ProjectsIndex />;
}

function Line({ n, children }) {
  return (
    <div style={S.line}>
      <span style={S.gutter}>{n}</span>
      <span style={S.lineTxt}>{children}</span>
    </div>
  );
}

function ProjectsIndex() {
  return (
    <>
      <Line n={1}><span style={T.cmt}>// projects.jsx — 精選作品（點右側卡片看細節）</span></Line>
      <Line n={2}><span style={T.kw}>export const</span> <span style={T.fn}>projects</span> = [</Line>
      {PROJECTS.map((p, i) => (
        <Line n={3 + i} key={p.id}>
          {"  { "}<span style={T.prop}>name</span>: <span style={T.str}>"{p.name}"</span>{" },"}
        </Line>
      ))}
      <Line n={3 + PROJECTS.length}>];</Line>
    </>
  );
}

function ProjectShowcase({ p, onOpen }) {
  const { isMobile } = useContext(UI);
  const others = PROJECTS.filter((x) => x.id !== p.id);
  return (
    <div style={{ ...S.showcase, ...(isMobile ? S.showcaseM : {}) }}>
      <div style={S.showInner}>
        {/* 大視覺：換成真實截圖 <img src=...> 效果更好 */}
        <div style={{ ...S.hero, ...(isMobile ? S.heroM : {}), background: p.grad }}>
          <span style={{ fontSize: isMobile ? 52 : 72 }}>{p.emoji}</span>
        </div>
        <div style={S.showRole}>{p.role}</div>
        <h1 style={{ ...S.showTitle, ...(isMobile ? S.showTitleM : {}) }}>{p.name}</h1>
        <p style={{ ...S.showDesc, ...(isMobile ? S.showDescM : {}) }}>{p.detail}</p>
        <div style={S.stRow}>{p.tags.map((t) => (<span key={t} style={S.stBig}>{t}</span>))}</div>
        <a href={"https://" + p.link} target="_blank" rel="noreferrer" style={S.showLink}>↗ {p.link}</a>

        <div style={S.moreRow}>
          <div style={S.moreLabel}>其他作品</div>
          {others.map((o) => (
            <button key={o.id} style={S.moreItem} onClick={() => onOpen(o.id)}>
              <span style={{ fontSize: 20 }}>{o.emoji}</span>
              <span>{o.name}</span>
              <span style={{ color: "#6c7086", marginLeft: "auto" }}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AboutCode() {
  const sk = Object.entries(DEV.skills);
  return (
    <>
      <Line n={1}><span style={T.cmt}>// about.me</span></Line>
      <Line n={2}><span style={T.kw}>const</span> <span style={T.fn}>developer</span> = {"{"}</Line>
      <Line n={3}>{"  "}<span style={T.prop}>name</span>: <span style={T.str}>"{DEV.name}"</span>,</Line>
      <Line n={4}>{"  "}<span style={T.prop}>role</span>: <span style={T.str}>"{DEV.role}"</span>,</Line>
      <Line n={5}>{"  "}<span style={T.prop}>based</span>: <span style={T.str}>"{DEV.based}"</span>,</Line>
      <Line n={6}>{"  "}<span style={T.prop}>coffee</span>: <span style={T.num}>Infinity</span>,</Line>
      <Line n={7}>{"  "}<span style={T.prop}>skills</span>: {"{"}</Line>
      {sk.map(([k, v], i) => (
        <Line n={8 + i} key={k}>{"    "}<span style={T.prop}>{k}</span>: <span style={T.str}>"{v}"</span>,</Line>
      ))}
      <Line n={8 + sk.length}>{"  "}{"}"},</Line>
      <Line n={9 + sk.length}>{"}"};</Line>
      <Line n={10 + sk.length}> </Line>
      <Line n={11 + sk.length}><span style={T.cmt}>/* 熱愛把想法變成可以互動的東西，目前正在找機會。 */</span></Line>
      <Line n={12 + sk.length}><span style={T.kw}>export default</span> <span style={T.fn}>developer</span>;</Line>
    </>
  );
}

function ContactCode() {
  const rows = [["email", "you@example.com"], ["github", "github.com/yourname"], ["linkedin", "in/yourname"]];
  return (
    <>
      <Line n={1}><span style={T.kw}>export const</span> <span style={T.fn}>contact</span> = {"{"}</Line>
      {rows.map(([k, v], i) => (
        <Line n={2 + i} key={k}>{"  "}<span style={T.prop}>{k}</span>: <span style={T.str}>"{v}"</span>,</Line>
      ))}
      <Line n={2 + rows.length}>{"}"};</Line>
    </>
  );
}

function AboutPhoto() {
  const { isMobile } = useContext(UI);
  return (
    <div style={{ ...S.photoPane, ...(isMobile ? S.paneM : {}) }}>
      <div style={S.phead}>◎ whoami</div>
      <div style={{ ...S.photoFrame, ...(isMobile ? S.photoFrameM : {}) }}>
        {DEV.photo ? (
          <img src={DEV.photo} alt={DEV.name} style={S.photoImg} />
        ) : (
          <div style={S.photoPlaceholder}>
            <span style={{ fontSize: 40 }}>🧑‍💻</span>
            <span style={{ fontSize: 12, color: "#6c7086", marginTop: 10 }}>
              放上你的照片<br />（設定 DEV.photo）
            </span>
          </div>
        )}
      </div>
      <div style={S.photoCap}>
        <span style={{ color: "#a6e3a1" }}>{DEV.name}</span>
        <span style={{ color: "#6c7086" }}> · {DEV.based}</span>
      </div>
    </div>
  );
}

function PCard({ p, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...S.pcard, transform: hover ? "translateY(-3px)" : "none", borderColor: hover ? "#89b4fa" : "#45475a" }}
    >
      <div style={{ ...S.thumb, background: p.grad }}>{p.emoji}</div>
      <div style={{ padding: "10px 14px" }}>
        <h4 style={S.pcardH}>{p.name}</h4>
        <p style={S.pcardP}>{p.short}</p>
        <div style={S.stRow}>{p.tags.map((t) => (<span key={t} style={S.st}>{t}</span>))}</div>
      </div>
    </div>
  );
}

function Terminal() {
  const { isMobile } = useContext(UI);
  const [lines, setLines] = useState([]);
  const timers = useRef([]);
  useEffect(() => {
    const seq = [
      { html: <><span style={{ color: "#6c7086" }}>→ loading projects...</span></>, d: 500 },
      { html: <><span style={{ color: "#a6e3a1" }}>✓ 3 projects loaded</span></>, d: 700 },
      { html: <><span style={{ color: "#6c7086" }}>→ 點左側檔案或右側卡片探索 ✨</span></>, d: 500 },
    ];
    let acc = 0;
    seq.forEach((s) => {
      acc += s.d;
      timers.current.push(setTimeout(() => setLines((l) => [...l, s.html]), acc));
    });
    return () => timers.current.forEach(clearTimeout);
  }, []);
  return (
    <div style={{ ...S.term, ...(isMobile ? S.termM : {}) }}>
      <div style={S.thead}>Terminal</div>
      <div><span style={{ color: "#27c93f" }}>➜ ~/portfolio</span> npm run showcase</div>
      {lines.map((l, i) => (<div key={i}>{l}</div>))}
      <span style={S.cursor} />
    </div>
  );
}

// helpers
function splitExt(label) { const i = label.lastIndexOf("."); return i < 0 ? [label, ""] : [label.slice(0, i), label.slice(i)]; }
function fileNameOf(id) {
  const p = PROJECTS.find((x) => x.id === id);
  if (p) return p.file;
  return { projects: "projects.jsx", about: "about.md", contact: "contact.ts" }[id] || id;
}

// ---- styles ----
const mono = "'SF Mono','JetBrains Mono','Fira Code',Consolas,monospace";
const S = {
  app: { display: "grid", gridTemplateColumns: "210px 1fr", height: "100dvh", fontFamily: mono, background: "#1e1e2e", color: "#cdd6f4", fontSize: 13 },
  side: { background: "#181825", borderRight: "1px solid #45475a", overflowY: "auto", padding: "8px 0" },
  root: { fontSize: 12, color: "#6c7086", padding: "6px 14px" },
  sideTitle: { fontSize: 11, color: "#6c7086", textTransform: "uppercase", letterSpacing: ".1em", padding: "8px 14px" },
  folder: { fontSize: 13, color: "#cdd6f4", padding: "5px 14px", display: "flex", gap: 6, cursor: "pointer" },
  file: { display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", fontSize: 13, color: "#cdd6f4", cursor: "pointer" },
  main: { display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, flex: 1 },
  tabs: { display: "flex", background: "#181825", borderBottom: "1px solid #45475a", overflowX: "auto", flexShrink: 0 },
  tab: { padding: "8px 12px 8px 16px", fontSize: 13, color: "#6c7086", borderRight: "1px solid #45475a", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" },
  tabActive: { color: "#cdd6f4", background: "#1e1e2e", borderTop: "2px solid #89b4fa" },
  close: { color: "#6c7086", fontSize: 15, lineHeight: 1 },
  split: { display: "grid", flex: 1, overflow: "hidden", minHeight: 0 },
  codePane: { overflowY: "auto", padding: "14px 0", background: "#1e1e2e", borderRight: "1px solid #45475a", lineHeight: 1.75 },
  line: { display: "flex", whiteSpace: "pre-wrap" },
  gutter: { textAlign: "right", color: "#45475a", padding: "0 12px", minWidth: 40, userSelect: "none" },
  lineTxt: { paddingRight: 16 },
  preview: { overflowY: "auto", background: "#15151f", padding: 16 },
  photoPane: { overflowY: "auto", background: "#15151f", padding: 16, display: "flex", flexDirection: "column" },
  photoFrame: { flex: 1, minHeight: 260, borderRadius: 14, overflow: "hidden", border: "1px solid #45475a", background: "#1e1e2e", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" },
  photoPlaceholder: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", background: "linear-gradient(135deg,#89b4fa22,#cba6f722)", width: "100%", height: "100%", justifyContent: "center" },
  photoCap: { fontSize: 13, textAlign: "center" },
  phead: { fontSize: 11, color: "#6c7086", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 },
  pcard: { background: "#252537", border: "1px solid #45475a", borderRadius: 10, overflow: "hidden", marginBottom: 14, cursor: "pointer", transition: "transform .18s, border-color .18s" },
  thumb: { height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 },
  pcardH: { fontSize: 14, color: "#cdd6f4", marginBottom: 3 },
  pcardP: { fontSize: 12, color: "#6c7086", lineHeight: 1.5 },
  stRow: { display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" },
  st: { fontSize: 10.5, background: "#1e1e2e", color: "#89dceb", padding: "2px 8px", borderRadius: 12 },
  detail: { color: "#cdd6f4" },
  back: { background: "none", border: "1px solid #45475a", color: "#89b4fa", fontFamily: mono, fontSize: 12, padding: "5px 10px", borderRadius: 6, cursor: "pointer", marginBottom: 14 },
  detailH: { fontSize: 18, marginTop: 14, marginBottom: 4 },
  detailRole: { fontSize: 12, color: "#89dceb", marginBottom: 10 },
  detailP: { fontSize: 13, color: "#bac2de", lineHeight: 1.7, marginBottom: 12 },
  link: { display: "inline-block", marginTop: 14, color: "#89b4fa", fontSize: 13, textDecoration: "none" },
  showcase: { overflowY: "auto", background: "#1e1e2e", padding: "32px 24px" },
  showInner: { maxWidth: 620, margin: "0 auto" },
  hero: { height: 220, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, border: "1px solid #45475a" },
  showRole: { fontSize: 13, color: "#89dceb", marginBottom: 6 },
  showTitle: { fontSize: 30, fontWeight: 700, color: "#cdd6f4", letterSpacing: "-.01em", marginBottom: 14, lineHeight: 1.2 },
  showDesc: { fontSize: 15, color: "#bac2de", lineHeight: 1.8, marginBottom: 18 },
  stBig: { fontSize: 12.5, background: "#252537", color: "#89dceb", padding: "5px 12px", borderRadius: 14, border: "1px solid #45475a" },
  showLink: { display: "inline-block", marginTop: 20, color: "#89b4fa", fontSize: 14, textDecoration: "none", borderBottom: "1px solid #89b4fa44", paddingBottom: 2 },
  moreRow: { marginTop: 44, paddingTop: 24, borderTop: "1px solid #313244" },
  moreLabel: { fontSize: 11, color: "#6c7086", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 },
  moreItem: { display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "#252537", border: "1px solid #45475a", borderRadius: 8, padding: "10px 14px", marginBottom: 8, color: "#cdd6f4", fontFamily: mono, fontSize: 13, cursor: "pointer" },
  term: { background: "#0a0e14", borderTop: "1px solid #45475a", padding: "10px 16px", fontSize: 12.5, lineHeight: 1.7, maxHeight: 150, overflowY: "auto", flexShrink: 0 },
  thead: { fontSize: 10, color: "#6c7086", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 },
  cursor: { display: "inline-block", width: 8, height: 14, background: "#27c93f", verticalAlign: "middle" },

  // ---- 手機頂部列 / 抽屜 ----
  mtop: { display: "flex", alignItems: "center", gap: 10, background: "#181825", borderBottom: "1px solid #45475a", padding: "8px 12px", flexShrink: 0 },
  mBurger: { background: "none", border: "none", color: "#cdd6f4", fontSize: 20, lineHeight: 1, cursor: "pointer", padding: "2px 4px" },
  mTitle: { fontSize: 12, color: "#6c7086" },
  mFile: { fontSize: 12, color: "#89b4fa", marginLeft: "auto", maxWidth: "45%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  backdrop: { position: "fixed", inset: 0, background: "#000a", zIndex: 40 },

  // ---- 手機版樣式覆寫 ----
  paneM: { overflowY: "visible", flexShrink: 0 },
  codePaneM: { overflowY: "visible", borderRight: "none", borderBottom: "1px solid #45475a", flexShrink: 0, fontSize: 12 },
  showcaseM: { overflowY: "visible", padding: "22px 16px", flex: 1 },
  heroM: { height: 150, marginBottom: 18 },
  showTitleM: { fontSize: 23, marginBottom: 10 },
  showDescM: { fontSize: 14, lineHeight: 1.7, marginBottom: 14 },
  photoFrameM: { minHeight: 220 },
  termM: { maxHeight: 110, fontSize: 11.5, padding: "8px 14px" },
};
