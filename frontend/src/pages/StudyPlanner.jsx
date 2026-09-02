import { useState } from "react";
import { Calendar, Plus, Trash2, CheckCircle2, Circle, Clock } from "lucide-react";

export default function StudyPlanner() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Complete Mathematics Assignment", subject: "Mathematics", dueDate: "2024-01-15", priority: "high", completed: false },
    { id: 2, title: "Read Chapter 5 of Physics", subject: "Physics", dueDate: "2024-01-16", priority: "medium", completed: false },
    { id: 3, title: "Prepare for Chemistry Lab", subject: "Chemistry", dueDate: "2024-01-17", priority: "high", completed: true },
  ]);

  const [newTask, setNewTask] = useState({ title: "", subject: "", dueDate: "", priority: "medium" });

  const addTask = () => {
    if (!newTask.title.trim() || !newTask.subject.trim()) return;
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        ...newTask,
        completed: false,
      },
    ]);
    setNewTask({ title: "", subject: "", dueDate: "", priority: "medium" });
  };

  const removeTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-ember";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-green-600";
      default:
        return "text-muted";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return "badge-gold";
      case "medium":
        return "badge";
      case "low":
        return "badge-green";
      default:
        return "badge";
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland dark:bg-dark-surface dark:border-dark-border">
          <Calendar size={16} />
          Academic Tools
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Study Planner</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Organize your study schedule, track assignments, and manage your academic tasks efficiently.
        </p>
      </div>

      <section className="space-y-6">
        <div className="section-panel rounded-xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Progress Overview</h2>
            <div className="text-right">
              <span className="text-3xl font-bold text-highland">{progress}%</span>
              <p className="text-sm text-muted">{completedCount} of {tasks.length} completed</p>
            </div>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-mist">
            <div
              className="h-full bg-highland transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="section-panel rounded-xl p-6">
          <h2 className="mb-6 text-lg font-semibold text-ink">Add New Task</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="field-label">Task Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g., Complete Chapter 3 Assignment"
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Subject</label>
              <input
                type="text"
                value={newTask.subject}
                onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                placeholder="e.g., Mathematics"
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="select-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <button onClick={addTask} className="btn-dark w-full">
                <Plus size={16} />
                Add Task
              </button>
            </div>
          </div>
        </div>

        <div className="section-panel rounded-xl p-6">
          <h2 className="mb-6 text-lg font-semibold text-ink">Your Tasks</h2>
          {sortedTasks.length === 0 ? (
            <div className="empty-state py-12">No tasks yet. Add your first task above!</div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    task.completed
                      ? "border-line bg-muted/30"
                      : "border-line bg-white dark:bg-dark-surface"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="text-highland"
                    >
                      {task.completed ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <Circle size={24} />
                      )}
                    </button>
                    <div>
                      <h3
                        className={`font-semibold ${
                          task.completed ? "text-muted line-through" : "text-ink"
                        }`}
                      >
                        {task.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                        <span className="text-muted">{task.subject}</span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-muted">
                            <Clock size={14} />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span className={getPriorityBadge(task.priority)}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="btn-ghost border-ember/30 text-ember hover:border-ember hover:text-ember"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
