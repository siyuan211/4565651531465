/* =========================================
 * 高一3班 · 光荣榜
 * 数据:名字 + 排名 + 签名版,签完名即为领奖
 * 存储:GitHub 仓库文件(data.json),多人共享同一份数据
 * 部署:GitHub Pages / Netlify 静态托管
 * ========================================= */

const CFG = window.GITHUB_CONFIG || {};

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

const els = {
  saveStatus: $("saveStatus"),
  rankTop3: $("rankTop3"),
  rankImprove: $("rankImprove"),
  rankGroup: $("rankGroup"),
  signCards: $("signCards"),
  btnAdmin: $("btnAdmin"),
  adminBadge: $("adminBadge"),
  adminModal: $("adminModal"),
  adminAuth: $("adminAuth"),
  adminPanel: $("adminPanel"),
  adminPass: $("adminPass"),
  btnAdminLogin: $("btnAdminLogin"),
  adminErr: $("adminErr"),
  btnCloseModal: $("btnCloseModal"),
  top3Editor: $("top3Editor"),
  improveEditor: $("improveEditor"),
  groupEditor: $("groupEditor"),
  btnAddTop3: $("btnAddTop3"),
  btnAddImprove: $("btnAddImprove"),
  btnAddGroup: $("btnAddGroup"),
  btnSaveGit: $("btnSaveGit"),
  btnLogout: $("btnLogout"),
  signModal: $("signModal"),
  btnCloseSign: $("btnCloseSign"),
  signModalName: $("signModalName"),
  signCanvas: $("signCanvas"),
  btnClearCanvas: $("btnClearCanvas"),
  btnDeleteSign: $("btnDeleteSign"),
  btnSaveSign: $("btnSaveSign"),
};

// ---------- 应用状态 ----------
let isAdmin = false;
let draft = { top3: [], improve3: [], group2: [], signatures: {} };
let currentSignName = null;
let saving = false;

// ---------- GitHub 存储 ----------
function gitReady() {
  return CFG.owner && CFG.repo && CFG.path;
}

function apiBase() {
  return `https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${CFG.path}`;
}

function authHeaders() {
  return CFG.token ? { Authorization: `Bearer ${CFG.token}` } : {};
}

function setStatus(text, ok) {
  els.saveStatus.textContent = text;
  els.saveStatus.style.color = ok ? "#27ae60" : "#e74c3c";
}

// 从 GitHub 拉取数据(走 API,无 CDN 缓存,永远最新)
async function loadFromGitHub() {
  if (!gitReady()) {
    setStatus("未配置 GitHub,请在 config.js 填写", false);
    return;
  }
  setStatus("加载中…", true);
  try {
    const url = apiBase() + `?ref=${CFG.branch}&ts=${Date.now()}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json", ...authHeaders() },
    });
    if (res.status === 404) {
      setStatus("仓库里还没有数据文件", true);
      renderAll();
      return;
    }
    if (!res.ok) {
      setStatus("加载失败(" + res.status + ")", false);
      return;
    }
    const meta = await res.json();
    const jsonText = decodeURIComponent(escape(atob(meta.content)));
    const data = JSON.parse(jsonText);
    draft = {
      top3: Array.isArray(data.top3) ? data.top3 : [],
      improve3: Array.isArray(data.improve3) ? data.improve3 : [],
      group2: Array.isArray(data.group2) ? data.group2 : [],
      signatures: data.signatures && typeof data.signatures === "object" ? data.signatures : {},
    };
    setStatus("已同步", true);
  } catch (e) {
    setStatus("加载失败:" + e.message, false);
  }
  renderAll();
}

// 写入 GitHub(创建或更新 data.json)
async function saveToGitHub() {
  if (!gitReady()) {
    alert("未配置 GitHub,请按 README 填写 config.js");
    return;
  }
  if (!CFG.token) {
    alert("config.js 里缺少 token,无法写入 GitHub。请按 README 生成令牌填入。");
    return;
  }
  if (saving) return;
  saving = true;
  setStatus("保存中…", true);

  try {
    const encoder = new TextEncoder();
    const utf8 = encoder.encode(JSON.stringify(draft, null, 2));
    let bin = "";
    for (const b of utf8) bin += String.fromCharCode(b);
    const content = btoa(bin);

    // 先查询文件是否存在以获取 sha
    let sha = null;
    const head = await fetch(apiBase() + `?ref=${CFG.branch}`, {
      headers: { Accept: "application/vnd.github+json", ...authHeaders() },
    });
    if (head.ok) {
      const meta = await head.json();
      sha = meta.sha;
    }

    const body = {
      message: "更新光荣榜数据",
      content,
      branch: CFG.branch,
    };
    if (sha) body.sha = sha;

    const res = await fetch(apiBase(), {
      method: "PUT",
      headers: { Accept: "application/vnd.github+json", ...authHeaders() },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setStatus("已保存到 GitHub ✅", true);
      loadFromGitHub();
    } else {
      const err = await res.json().catch(() => ({}));
      const msg = err.message || res.status;
      setStatus("保存失败", false);
      alert("保存失败:" + msg + "\n\n如果是认证失败,请检查 token 是否有 repo 写入权限;若是 sha 冲突,请刷新页面重试。");
    }
  } catch (e) {
    setStatus("保存失败", false);
    alert("保存失败:" + e.message);
  }
  saving = false;
}

// ---------- 渲染 ----------
function renderAll() {
  renderRank(els.rankTop3, draft.top3, "top3");
  renderRank(els.rankImprove, draft.improve3, "improve3");
  renderRank(els.rankGroup, draft.group2, "group2");
  renderSignCards();
  if (isAdmin) renderEditors();
}

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_BG = ["#f1c40f", "#95a5a6", "#b9770e"];

function renderRank(container, names, cat) {
  if (!names.length) {
    container.innerHTML = `<li class="empty">暂无数据</li>`;
    return;
  }
  container.innerHTML = names
    .map((name, i) => {
      const rank = i + 1;
      const signed = !!draft.signatures[name];
      return `<li class="rank-item" data-sign="${escapeAttr(name)}" title="点击签名">
        <span class="medal" style="background:${MEDAL_BG[i] || "#bdc3c7"}">${MEDALS[i] || rank}</span>
        <span class="name">${escapeHtml(name)}</span>
        <span class="rank-label">${signed ? "✅ 已签名" : "✍️ 签名领奖"} · 第${CN_NUM(rank)}名</span>
      </li>`;
    })
    .join("");

  container.querySelectorAll("[data-sign]").forEach((item) => {
    item.addEventListener("click", () => openSignModal(item.dataset.sign));
  });
}

function renderSignCards() {
  const all = collectHonored();
  if (!all.length) {
    els.signCards.innerHTML = `<p class="empty">榜单为空,签名版将自动生成。</p>`;
    return;
  }
  els.signCards.innerHTML = all
    .map(({ name, cat }) => {
      const sig = draft.signatures[name];
      const signed = !!sig;
      const catIcon = cat === "top3" ? "🏆" : cat === "improve3" ? "🚀" : "👥";
      return `<div class="sign-card" data-sign="${escapeAttr(name)}">
        <div class="card-rank">${catIcon}</div>
        <div class="card-name">${escapeHtml(name)}</div>
        ${signed
          ? `<img class="sign-preview" src="${sig}" alt="签名" />
             <span class="signed-tag">✅ 已签名</span>`
          : `<div class="sign-preview"></div>`}
        <button class="btn ${signed ? "btn-ghost" : "btn-primary"}">${signed ? "✍️ 重新签名" : "✍️ 签名领奖"}</button>
      </div>`;
    })
    .join("");

  els.signCards.querySelectorAll("[data-sign]").forEach((card) => {
    card.addEventListener("click", () => openSignModal(card.dataset.sign));
  });
}

function collectHonored() {
  const out = [];
  draft.top3.forEach((n) => n && out.push({ name: n, cat: "top3" }));
  draft.improve3.forEach((n) => n && out.push({ name: n, cat: "improve3" }));
  draft.group2.forEach((n) => n && out.push({ name: n, cat: "group2" }));
  return out;
}

// ---------- 教师管理 ----------
els.btnAdmin.addEventListener("click", () => {
  els.adminModal.hidden = false;
  if (isAdmin) {
    els.adminAuth.hidden = true;
    els.adminPanel.hidden = false;
    renderEditors();
  } else {
    els.adminAuth.hidden = false;
    els.adminPanel.hidden = true;
  }
});

els.btnAdminLogin.addEventListener("click", () => {
  if (els.adminPass.value === (CFG.adminPass || "123456")) {
    isAdmin = true;
    els.adminErr.hidden = true;
    els.adminAuth.hidden = true;
    els.adminPanel.hidden = false;
    els.adminBadge.hidden = false;
    renderEditors();
  } else {
    els.adminErr.hidden = false;
  }
});

els.btnLogout.addEventListener("click", () => {
  isAdmin = false;
  els.adminBadge.hidden = true;
  els.adminPass.value = "";
  els.adminModal.hidden = true;
});

els.btnCloseModal.addEventListener("click", () => {
  els.adminModal.hidden = true;
});

els.btnAddTop3.addEventListener("click", () => addEditorRow("top3", ""));
els.btnAddImprove.addEventListener("click", () => addEditorRow("improve3", ""));
els.btnAddGroup.addEventListener("click", () => addEditorRow("group2", ""));

// 保存榜单到 GitHub
els.btnSaveGit.addEventListener("click", () => {
  const read = (container) =>
    [...container.querySelectorAll("input")]
      .map((i) => i.value.trim())
      .filter(Boolean);
  draft.top3 = read(els.top3Editor);
  draft.improve3 = read(els.improveEditor);
  draft.group2 = read(els.groupEditor);
  saveToGitHub();
});

function renderEditors() {
  els.top3Editor.innerHTML = "";
  els.improveEditor.innerHTML = "";
  els.groupEditor.innerHTML = "";
  draft.top3.forEach((n) => addEditorRow("top3", n));
  draft.improve3.forEach((n) => addEditorRow("improve3", n));
  draft.group2.forEach((n) => addEditorRow("group2", n));
}

function addEditorRow(cat, value) {
  const box =
    cat === "top3" ? els.top3Editor : cat === "improve3" ? els.improveEditor : els.groupEditor;
  const div = document.createElement("div");
  div.className = "editor-row";
  div.innerHTML = `
    <input type="text" value="${escapeAttr(value)}" placeholder="同学名字" />
    <button class="btn btn-del">✕</button>`;
  div.querySelector(".btn-del").addEventListener("click", () => {
    div.remove();
  });
  box.appendChild(div);
}

// ---------- 手写签名 ----------
let ctx = null;
let drawing = false;
let lastPos = null;

function openSignModal(name) {
  currentSignName = name;
  els.signModalName.textContent = `${name} 同学`;
  els.signModal.hidden = false;
  setupCanvas();

  // 已有签名时,显示为浅色底稿,方便重新签名;并显示删除按钮
  const old = draft.signatures[name];
  if (old) {
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = 0.35;
      ctx.drawImage(img, 0, 0, els.signCanvas.width, els.signCanvas.height);
      ctx.globalAlpha = 1;
    };
    img.src = old;
    els.btnDeleteSign.hidden = false;
  } else {
    els.btnDeleteSign.hidden = true;
  }
}

function setupCanvas() {
  const canvas = els.signCanvas;
  ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#2c3e50";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawing = false;
  lastPos = null;
}

function pos(e) {
  const rect = els.signCanvas.getBoundingClientRect();
  const scaleX = els.signCanvas.width / rect.width;
  const scaleY = els.signCanvas.height / rect.height;
  const t = e.touches ? e.touches[0] : e;
  return {
    x: (t.clientX - rect.left) * scaleX,
    y: (t.clientY - rect.top) * scaleY,
  };
}

function startDraw(e) {
  e.preventDefault();
  drawing = true;
  lastPos = pos(e);
}

function moveDraw(e) {
  if (!drawing || !ctx) return;
  e.preventDefault();
  const p = pos(e);
  ctx.beginPath();
  ctx.moveTo(lastPos.x, lastPos.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  lastPos = p;
}

function endDraw() {
  drawing = false;
  lastPos = null;
}

// 鼠标支持
els.signCanvas.addEventListener("mousedown", startDraw);
els.signCanvas.addEventListener("mousemove", moveDraw);
window.addEventListener("mouseup", endDraw);

// 触摸支持(手机/平板)
els.signCanvas.addEventListener("touchstart", startDraw, { passive: false });
els.signCanvas.addEventListener("touchmove", moveDraw, { passive: false });
els.signCanvas.addEventListener("touchend", endDraw);
els.signCanvas.addEventListener("touchcancel", endDraw);

els.btnClearCanvas.addEventListener("click", () => {
  ctx.clearRect(0, 0, els.signCanvas.width, els.signCanvas.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, els.signCanvas.width, els.signCanvas.height);
});

// 删除已有签名(仅教师可删,防止误删他人签名)
els.btnDeleteSign.addEventListener("click", () => {
  if (!currentSignName) return;
  if (!isAdmin) {
    alert("只有教师模式可以删除签名,重新签名请在画布上直接重写。");
    return;
  }
  if (!confirm(`确定删除「${currentSignName}」的签名吗?`)) return;
  delete draft.signatures[currentSignName];
  saveToGitHub().then(() => {
    els.signModal.hidden = true;
  });
});

els.btnSaveSign.addEventListener("click", () => {
  if (!currentSignName) return;
  const dataUrl = els.signCanvas.toDataURL("image/png");
  const trimmed = dataUrl.replace(/^data:image\/\w+;base64,/, "").replace(/0+$/, "");
  if (trimmed.length < 50) {
    alert("请先手写签名");
    return;
  }
  draft.signatures[currentSignName] = dataUrl;
  saveToGitHub().then(() => {
    els.signModal.hidden = true;
  });
});

els.btnCloseSign.addEventListener("click", () => {
  els.signModal.hidden = true;
});

// 点击遮罩关闭
[els.adminModal, els.signModal].forEach((m) => {
  m.addEventListener("click", (e) => {
    if (e.target === m) m.hidden = true;
  });
});

// ---------- 工具 ----------
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function CN_NUM(n) {
  return ["一", "二", "三", "四", "五", "六", "七", "八", "九"][n - 1] || n;
}

// ---------- 启动 ----------
loadFromGitHub();
