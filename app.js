// app.js — renders the course and tracks per-person progress in localStorage.

const state = {
  person: localStorage.getItem("course.person") || "shilpi",
  phase: null, // phase id, defaults to first
};

const STORAGE_KEY = "course.progress"; // { [personId]: { [taskId]: true } }

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}
function saveProgress(all) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
function personProgress() {
  const all = loadProgress();
  return all[state.person] || {};
}

// A task belongs to the current person if who === "both" or who === person.
function taskBelongsTo(task, personId) {
  return task.who === "both" || task.who === personId;
}

function allTasks() {
  const tasks = [];
  for (const phase of COURSE.phases) {
    phase.blocks.forEach((block, i) => {
      if (block.type === "task") tasks.push({ phaseId: phase.id, blockIndex: i, ...block });
    });
  }
  return tasks;
}

function taskKey(phaseId, blockIndex) {
  return `${phaseId}:${blockIndex}`;
}

// ---------- tiny markdown (code, bold, links, lists) ----------
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}
function md(text) {
  const lines = String(text).split("\n");
  let html = "";
  let inList = false;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += "<li>" + inline(li[1]) + "</li>";
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      if (line.trim() !== "") html += "<p>" + inline(line) + "</p>";
    }
  }
  if (inList) html += "</ul>";
  return html;
}

// ---------- rendering ----------

function render() {
  renderHeader();
  renderPersonTabs();
  renderSidebar();
  renderContent();
}

function renderHeader() {
  document.getElementById("course-title").textContent = COURSE.title;
  document.getElementById("course-subtitle").textContent = COURSE.subtitle;

  const mine = allTasks().filter((t) => taskBelongsTo(t, state.person));
  const done = mine.filter((t) => personProgress()[taskKey(t.phaseId, t.blockIndex)]).length;
  const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
  document.getElementById("overall-text").innerHTML =
    `<b>${done}</b> of <b>${mine.length}</b> tasks done · <b>${pct}%</b>`;
  document.getElementById("overall-fill").style.width = pct + "%";
}

function renderPersonTabs() {
  const wrap = document.getElementById("person-tabs");
  wrap.innerHTML = '<div class="person-tabs-inner"></div>';
  const inner = wrap.firstElementChild;
  for (const person of COURSE.people) {
    const btn = document.createElement("button");
    btn.className = "person-tab" + (person.id === state.person ? " active" : "");
    const mine = allTasks().filter((t) => taskBelongsTo(t, person.id));
    const done = mine.filter((t) => (loadProgress()[person.id] || {})[taskKey(t.phaseId, t.blockIndex)]).length;
    btn.innerHTML = `${person.name} <span class="pill">${done}/${mine.length}</span>`;
    btn.onclick = () => {
      state.person = person.id;
      localStorage.setItem("course.person", person.id);
      render();
    };
    inner.appendChild(btn);
  }
}

function renderSidebar() {
  const side = document.getElementById("sidebar");
  side.innerHTML = "<h2>Course content</h2>";
  for (const phase of COURSE.phases) {
    const mine = phase.blocks
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => b.type === "task" && taskBelongsTo(b, state.person));
    const done = mine.filter(({ b, i }) => personProgress()[taskKey(phase.id, i)]).length;
    const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;

    const btn = document.createElement("button");
    btn.className = "phase-item" + (phase.id === state.phase ? " active" : "");
    btn.innerHTML = `
      <span class="phase-name">${phase.title}</span>
      <span class="phase-days">${phase.days}</span>
      <div class="phase-mini"><div class="phase-mini-fill" style="width:${pct}%"></div></div>
      <span class="phase-count">${done}/${mine.length} tasks</span>`;
    btn.onclick = () => {
      state.phase = phase.id;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    side.appendChild(btn);
  }
}

function renderContent() {
  const main = document.getElementById("content");
  const phase = COURSE.phases.find((p) => p.id === state.phase) || COURSE.phases[0];
  state.phase = phase.id;

  const mine = phase.blocks
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => b.type === "task" && taskBelongsTo(b, state.person));
  const done = mine.filter(({ b, i }) => personProgress()[taskKey(phase.id, i)]).length;
  const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;

  let html = `
    <div class="phase-header">
      <h2>${phase.title}</h2>
      <div class="days">${phase.days}</div>
      <div class="phase-progress">
        <div class="overall-label"><b>${done}</b> of <b>${mine.length}</b> tasks in this phase · <b>${pct}%</b></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
    </div>`;

  phase.blocks.forEach((block, i) => {
    html += renderBlock(block, i);
  });

  main.innerHTML = html;
  wireTasks();
}

function renderBlock(block, i) {
  if (block.type === "lesson") {
    return `
      <div class="block">
        <div class="block-head">
          <span class="block-type lesson">Lesson</span>
          <h3 class="block-title">${block.title}</h3>
        </div>
        <div class="block-body">${md(block.body)}</div>
      </div>`;
  }

  if (block.type === "video") {
    const embed = block.youtube
      ? `<div class="video-frame"><iframe src="https://www.youtube.com/embed/${block.youtube}" title="${block.title}" allowfullscreen loading="lazy"></iframe></div>`
      : "";
    return `
      <div class="block">
        <div class="block-head">
          <span class="block-type video">Video</span>
          <h3 class="block-title">${block.title}</h3>
        </div>
        ${block.detail ? `<div class="block-detail">${md(block.detail)}</div>` : ""}
        ${embed}
        <a class="video-link" href="${block.link}" target="_blank" rel="noopener">Open on the official site ↗</a>
      </div>`;
  }

  // task
  const key = taskKey(state.phase, i);
  const isMine = taskBelongsTo(block, state.person);
  const checked = !!personProgress()[key];
  const otherName = isMine
    ? ""
    : `<span class="who-tag">${COURSE.people.find((p) => p.id === block.who).name}'s task</span>`;
  return `
    <div class="block task-row ${checked ? "task-done" : ""} ${isMine ? "" : "task-other"}" data-key="${key}">
      <input type="checkbox" class="task-check" data-key="${key}" ${checked ? "checked" : ""} ${isMine ? "" : "disabled"}>
      <div class="task-text">
        <div class="block-head">
          <span class="block-type task">Assignment</span>
          <h3 class="block-title">${block.title}${otherName}</h3>
        </div>
        <div class="block-detail">${md(block.detail)}</div>
      </div>
    </div>`;
}

function wireTasks() {
  document.querySelectorAll(".task-check").forEach((box) => {
    box.onchange = () => {
      const all = loadProgress();
      all[state.person] = all[state.person] || {};
      if (box.checked) all[state.person][box.dataset.key] = true;
      else delete all[state.person][box.dataset.key];
      saveProgress(all);
      render();
    };
  });
}

// ---------- init ----------
render();
