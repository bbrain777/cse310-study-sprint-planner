import { useMemo, useState } from "react";

const STORAGE_KEY = "cse310-study-sprint-planner";
const SPRINT_GOAL_HOURS = 20;
const categories = ["Research", "Implementation", "Troubleshooting", "Documentation", "Video Production"];

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const defaultTasks = [
  {
    id: createId(),
    title: "Confirm React/Vite setup and project structure",
    category: "Research",
    hours: 2,
    status: "done",
    day: "Monday",
    notes: "Reviewed components, state, props, and Vite workflow.",
  },
  {
    id: createId(),
    title: "Build sprint task form and progress dashboard",
    category: "Implementation",
    hours: 3,
    status: "active",
    day: "Tuesday",
    notes: "Connect user input to React state and visible progress metrics.",
  },
  {
    id: createId(),
    title: "Record demo video and code walkthrough",
    category: "Video Production",
    hours: 2,
    status: "planned",
    day: "Saturday",
    notes: "Show my face, demonstrate the app, and explain how the code works.",
  },
];

const emptyForm = {
  title: "",
  category: categories[0],
  hours: "1",
  day: "Monday",
  notes: "",
};

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultTasks;
  } catch {
    return defaultTasks;
  }
}

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  function persist(nextTasks) {
    setTasks(nextTasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return;

    const nextTask = {
      ...form,
      id: editingId || createId(),
      title: trimmedTitle,
      hours: Math.max(Number(form.hours) || 0, 0.25),
      notes: form.notes.trim(),
      status: editingId ? tasks.find((task) => task.id === editingId)?.status || "planned" : "planned",
    };

    const nextTasks = editingId
      ? tasks.map((task) => (task.id === editingId ? nextTask : task))
      : [nextTask, ...tasks];

    persist(nextTasks);
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      category: task.category,
      hours: String(task.hours),
      day: task.day,
      notes: task.notes,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function removeTask(taskId) {
    persist(tasks.filter((task) => task.id !== taskId));
    if (editingId === taskId) cancelEdit();
  }

  function toggleComplete(taskId) {
    persist(
      tasks.map((task) => {
        if (task.id !== taskId) return task;
        return { ...task, status: task.status === "done" ? "active" : "done" };
      })
    );
  }

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.notes.toLowerCase().includes(query) ||
        task.day.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === "All" || task.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tasks, searchTerm, categoryFilter, statusFilter]);

  const summary = useMemo(() => {
    const totalHours = tasks.reduce((sum, task) => sum + Number(task.hours), 0);
    const completedHours = tasks
      .filter((task) => task.status === "done")
      .reduce((sum, task) => sum + Number(task.hours), 0);
    const categoryTotals = categories.map((category) => ({
      category,
      hours: tasks
        .filter((task) => task.category === category)
        .reduce((sum, task) => sum + Number(task.hours), 0),
    }));

    return {
      totalHours,
      completedHours,
      plannedCount: tasks.filter((task) => task.status === "planned").length,
      activeCount: tasks.filter((task) => task.status === "active").length,
      doneCount: tasks.filter((task) => task.status === "done").length,
      progressPercent: Math.min(Math.round((completedHours / SPRINT_GOAL_HOURS) * 100), 100),
      categoryTotals,
    };
  }, [tasks]);

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="top-bar">
          <div>
            <p className="eyebrow">CSE 310 Module #2</p>
            <h1>Study Sprint Planner</h1>
          </div>
          <a className="repo-link" href="https://github.com/bbrain777" target="_blank" rel="noreferrer">
            <span aria-hidden="true">GH</span>
            GitHub
          </a>
        </header>

        <section className="summary-grid" aria-label="Sprint summary">
          <SummaryCard icon="HR" label="Planned Hours" value={summary.totalHours.toFixed(1)} />
          <SummaryCard icon="OK" label="Completed Hours" value={summary.completedHours.toFixed(1)} />
          <SummaryCard icon="%" label="Sprint Progress" value={`${summary.progressPercent}%`} />
          <SummaryCard icon="TO" label="Open Tasks" value={summary.plannedCount + summary.activeCount} />
        </section>

        <section className="progress-panel">
          <div>
            <p className="panel-label">Progress toward 20 hour sprint</p>
            <div className="progress-track" aria-label={`${summary.progressPercent}% complete`}>
              <span style={{ width: `${summary.progressPercent}%` }} />
            </div>
          </div>
          <div className="status-counts" aria-label="Task status counts">
            <span>{summary.plannedCount} planned</span>
            <span>{summary.activeCount} active</span>
            <span>{summary.doneCount} done</span>
          </div>
        </section>

        <div className="content-grid">
          <section className="task-editor" aria-label="Task editor">
            <h2>{editingId ? "Edit Task" : "Add Sprint Task"}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Task
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Build filter controls"
                  required
                />
              </label>

              <div className="form-row">
                <label>
                  Category
                  <select name="category" value={form.category} onChange={handleChange}>
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Hours
                  <input name="hours" type="number" min="0.25" step="0.25" value={form.hours} onChange={handleChange} />
                </label>
              </div>

              <label>
                Day
                <select name="day" value={form.day} onChange={handleChange}>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </label>

              <label>
                Notes
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="What will this task help you learn?"
                  rows="4"
                />
              </label>

              <div className="button-row">
                <button type="submit" className="primary-button">
                  <span aria-hidden="true">{editingId ? "SV" : "AD"}</span>
                  {editingId ? "Save" : "Add"}
                </button>
                {editingId && (
                  <button type="button" className="ghost-button" onClick={cancelEdit} aria-label="Cancel edit">
                    <span aria-hidden="true">X</span>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="task-board" aria-label="Sprint tasks">
            <div className="board-toolbar">
              <div className="search-box">
                <span aria-hidden="true">Search</span>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search tasks"
                />
              </div>
              <div className="filter-row">
                <span aria-hidden="true">Filter</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option>All</option>
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option>All</option>
                  <option value="planned">planned</option>
                  <option value="active">active</option>
                  <option value="done">done</option>
                </select>
              </div>
            </div>

            <div className="task-list">
              {filteredTasks.length === 0 ? (
                <p className="empty-state">No matching tasks. Adjust the filters or add a new sprint task.</p>
              ) : (
                filteredTasks.map((task) => (
                  <article key={task.id} className={`task-card ${task.status}`}>
                    <button
                      type="button"
                      className="status-button"
                      onClick={() => toggleComplete(task.id)}
                      aria-label={task.status === "done" ? "Mark task active" : "Mark task complete"}
                    >
                      {task.status === "done" ? "OK" : ""}
                    </button>
                    <div className="task-details">
                      <div className="task-heading">
                        <h3>{task.title}</h3>
                        <span>{task.hours} hr</span>
                      </div>
                      <p>{task.notes || "No notes added yet."}</p>
                      <div className="task-meta">
                        <span>{task.category}</span>
                        <span>{task.day}</span>
                        <span>{task.status}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button type="button" onClick={() => startEdit(task)} aria-label={`Edit ${task.title}`}>
                        Edit
                      </button>
                      <button type="button" onClick={() => removeTask(task.id)} aria-label={`Delete ${task.title}`}>
                        Del
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="category-panel" aria-label="Hours by category">
          <h2>Hours by Category</h2>
          <div className="category-grid">
            {summary.categoryTotals.map((item) => (
              <div key={item.category} className="category-item">
                <span>{item.category}</span>
                <strong>{item.hours.toFixed(1)}</strong>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <article className="summary-card">
      <div className="summary-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

export default App;
