"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

type Status = "TODO" | "IN_PROGRESS" | "DONE";
type Task = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: "LOW" | "MEDIUM" | "HIGH";
};
type Active = { id: string; taskId: string; startTime: string } | null;

const COLUMNS: { id: Status; label: string; dot: string; empty: string }[] = [
  { id: "TODO", label: "To Do", dot: "bg-gray-400", empty: "Nothing here yet" },
  { id: "IN_PROGRESS", label: "In Progress", dot: "bg-blue-500", empty: "Drag a task here to start" },
  { id: "DONE", label: "Done", dot: "bg-emerald-500", empty: "Completed tasks appear here" },
];

// Priority keeps its own colors so it is easy to tell apart
const PRIORITY_BORDER: Record<Task["priority"], string> = {
  LOW: "border-l-emerald-500",
  MEDIUM: "border-l-amber-400",
  HIGH: "border-l-rose-500",
};

const PRIORITY_BADGE: Record<Task["priority"], string> = {
  LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  HIGH: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

function formatTime(total: number) {
  const s = Math.max(0, Math.floor(total));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

type CardProps = {
  task: Task;
  seconds: number;
  running: boolean;
  onDelete?: (id: string) => void;
  onToggle?: (id: string) => void;
};

function Card({ task, seconds, running, onDelete, onToggle }: CardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab touch-none rounded-xl border border-l-4 bg-white p-3 shadow-sm transition hover:shadow-md dark:bg-neutral-900 ${
        PRIORITY_BORDER[task.priority]
      } ${
        running
          ? "border-emerald-400 ring-2 ring-emerald-400/40 dark:border-emerald-500"
          : "border-gray-200 dark:border-neutral-800"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="break-words font-medium">{task.title}</p>
        {onDelete && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(task.id)}
            className="rounded p-1 text-xs text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
            aria-label="Delete task"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[task.priority]}`}>
          {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
        </span>

        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-sm ${
              running ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {formatTime(seconds)}
          </span>
          {onToggle && task.status !== "DONE" && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onToggle(task.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium text-white transition ${
                running ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {running ? "⏸ Stop" : "▶ Start"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({
  col,
  tasks,
  getSeconds,
  activeTaskId,
  onDelete,
  onToggle,
}: {
  col: (typeof COLUMNS)[number];
  tasks: Task[];
  getSeconds: (taskId: string) => number;
  activeTaskId: string | null;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border p-3 transition-colors ${
        isOver
          ? "border-gray-400 bg-gray-200 dark:border-neutral-600 dark:bg-neutral-800"
          : "border-gray-200 bg-gray-100 dark:border-neutral-800 dark:bg-neutral-950"
      }`}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
        <h2 className="text-sm font-semibold">{col.label}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 shadow-sm dark:bg-neutral-800 dark:text-gray-400">
          {tasks.length}
        </span>
      </div>

      <div className="min-h-[120px] space-y-2">
        {tasks.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 dark:border-neutral-700 dark:text-gray-500">
            {col.empty}
          </div>
        )}
        {tasks.map((t) => (
          <Card
            key={t.id}
            task={t}
            seconds={getSeconds(t.id)}
            running={activeTaskId === t.id}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [active, setActive] = useState<Active>(null);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadTimes = useCallback(async () => {
    const res = await fetch("/api/timelogs");
    if (!res.ok) return;
    const data = await res.json();
    setActive(data.active);
    setTotals(data.totals ?? {});
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setTasks(data);
        }),
      loadTimes(),
    ]).finally(() => setLoading(false));
  }, [loadTimes]);

  // While a timer is running, update the screen every second
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  function getSeconds(taskId: string) {
    const base = totals[taskId] ?? 0;
    if (active && active.taskId === taskId) {
      return base + (now - new Date(active.startTime).getTime()) / 1000;
    }
    return base;
  }

  async function toggleTimer(taskId: string) {
    if (active?.taskId === taskId) {
      await fetch("/api/timelogs", { method: "PATCH" });
    } else {
      const res = await fetch("/api/timelogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.movedToInProgress) {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: "IN_PROGRESS" } : t))
          );
        }
      }
    }
    setNow(Date.now());
    await loadTimes();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), priority }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks((prev) => [...prev, task]);
      setTitle("");
    }
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (active?.taskId === id) setActive(null);
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    loadTimes();
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active: dragged, over } = e;
    if (!over) return;
    const newStatus = over.id as Status;
    const task = tasks.find((t) => t.id === dragged.id);
    if (!task || task.status === newStatus) return;

    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      setTasks(previous);
      return;
    }
    // The server stops the timer when a task is marked Done, so reload
    if (newStatus === "DONE") await loadTimes();
  }

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;
  const runningTask = tasks.find((t) => t.id === active?.taskId) ?? null;

  return (
    <div>
      {runningTask && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Running: <b>{runningTask.title}</b>
          </span>
          <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
            {formatTime(getSeconds(runningTask.id))}
          </span>
        </div>
      )}

      <form
        onSubmit={addTask}
        className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task..."
          className="min-w-[200px] flex-1 rounded-lg border border-gray-300 bg-transparent px-3 py-2 outline-none transition placeholder:text-gray-400 focus:border-black dark:border-neutral-700 dark:focus:border-white"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Task["priority"])}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <button className="rounded-lg bg-black px-5 py-2 font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
          Add task
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((c) => (
              <Column
                key={c.id}
                col={c}
                tasks={tasks.filter((t) => t.status === c.id)}
                getSeconds={getSeconds}
                activeTaskId={active?.taskId ?? null}
                onDelete={deleteTask}
                onToggle={toggleTimer}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <Card
                task={activeTask}
                seconds={getSeconds(activeTask.id)}
                running={active?.taskId === activeTask.id}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}