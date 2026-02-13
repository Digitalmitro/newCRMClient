import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { onSoftRefresh } from "../../../utils/socket";

const STATUS_OPTIONS = ["Assigned", "Acknowledged", "Completed"];

const toInputDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const normalizeMonthLabel = (value) => {
  if (!value) return "No Deadline";
  const date = moment(value);
  if (!date.isValid()) return "No Deadline";
  return date.format("MMMM YYYY");
};

const ChannelTaskManager = ({
  channelId,
  channelName,
  channelMembers = [],
  currentUserId,
  showList = true,
  openCreateTaskSignal = 0,
  focusTaskNumber = "",
  focusTaskSignal = 0,
}) => {
  const token = localStorage.getItem("token");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [error, setError] = useState("");
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const [highlightTaskNumber, setHighlightTaskNumber] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    month: "",
    assignedTo: "",
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
    assignedTo: "",
  });

  const memberOptions = useMemo(
    () =>
      (channelMembers || [])
        .filter((member) => member?._id)
        .map((member) => ({ id: member._id, name: member.name || "Unknown" })),
    [channelMembers]
  );

  const memberNameMap = useMemo(() => {
    const map = {};
    memberOptions.forEach((member) => {
      map[member.id.toString()] = member.name;
    });
    return map;
  }, [memberOptions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!channelId) {
      setIsCreateModalOpen(false);
      return;
    }
    if (openCreateTaskSignal > 0) {
      setError("");
      setIsCreateModalOpen(true);
    }
  }, [openCreateTaskSignal, channelId]);

  useEffect(() => {
    const normalizedTaskNumber = (focusTaskNumber || "").trim().toUpperCase();
    if (!normalizedTaskNumber) return undefined;
    setSearchInput(normalizedTaskNumber);
    setSearch(normalizedTaskNumber);
    setCollapsedMonths({});
    setHighlightTaskNumber(normalizedTaskNumber);
    const timer = setTimeout(() => {
      setHighlightTaskNumber((current) =>
        current === normalizedTaskNumber ? "" : current
      );
    }, 1800);
    return () => clearTimeout(timer);
  }, [focusTaskNumber, focusTaskSignal]);

  const fetchTasks = async () => {
    if (!channelId || !token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filters.status) params.append("status", filters.status);
      if (filters.month) params.append("month", filters.month);
      if (filters.assignedTo) params.append("assignedTo", filters.assignedTo);

      const query = params.toString();
      const endpoint = `${import.meta.env.VITE_BACKEND_API}/channels/${channelId}/tasks${
        query ? `?${query}` : ""
      }`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setTasks([]);
        setError(data?.message || "Unable to load tasks.");
        return;
      }
      setTasks(data?.tasks || []);
    } catch (fetchError) {
      setTasks([]);
      setError("Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showList) return;
    fetchTasks();
  }, [showList, channelId, search, filters.status, filters.month, filters.assignedTo]);

  useEffect(() => {
    if (!showList) return;
    const unsubscribe = onSoftRefresh((payload) => {
      if (payload?.type === "TASK") {
        fetchTasks();
      }
    });
    return () => unsubscribe();
  }, [showList, channelId, search, filters.status, filters.month, filters.assignedTo]);

  useEffect(() => {
    if (!memberOptions.length) return;
    setNewTask((prev) => {
      if (prev.assignedTo) return prev;
      return { ...prev, assignedTo: memberOptions[0].id };
    });
  }, [memberOptions]);

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setFilters({
      status: "",
      month: "",
      assignedTo: "",
    });
  };

  const closeCreateModal = () => {
    if (saving) return;
    setIsCreateModalOpen(false);
    setError("");
  };

  const openCreateModal = () => {
    setError("");
    setIsCreateModalOpen(true);
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.deadline || !newTask.assignedTo) {
      setError("Title, deadline and assignee are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        deadline: new Date(newTask.deadline).toISOString(),
        assignedTo: newTask.assignedTo,
      };
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/channels/${channelId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.message || "Unable to create task.");
        return;
      }

      setNewTask((prev) => ({
        title: "",
        description: "",
        deadline: "",
        assignedTo: prev.assignedTo,
      }));
      setIsCreateModalOpen(false);
      if (showList) {
        fetchTasks();
      }
    } catch (createError) {
      setError("Unable to create task.");
    } finally {
      setSaving(false);
    }
  };

  const patchTask = async (taskId, payload) => {
    if (!taskId) return;
    setUpdatingTaskId(taskId);
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/channels/${channelId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.message || "Unable to update task.");
        return;
      }
      fetchTasks();
    } catch (patchError) {
      setError("Unable to update task.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const groupedTasks = useMemo(() => {
    const groups = {};
    tasks.forEach((task) => {
      const key = moment(task.deadline).isValid()
        ? moment(task.deadline).format("YYYY-MM")
        : "no-deadline";
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    return groups;
  }, [tasks]);

  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedTasks).sort((a, b) => {
      if (a === "no-deadline") return 1;
      if (b === "no-deadline") return -1;
      return b.localeCompare(a);
    });
  }, [groupedTasks]);

  const toggleMonth = (key) => {
    setCollapsedMonths((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-base font-semibold">Create Task</h3>
              <button
                type="button"
                onClick={closeCreateModal}
                className="text-gray-500 hover:text-gray-700"
              >
                x
              </button>
            </div>

            <div className="p-4 space-y-3">
              {error && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(event) =>
                    setNewTask((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Task title"
                  className="border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                />
                <input
                  type="datetime-local"
                  value={newTask.deadline}
                  onChange={(event) =>
                    setNewTask((prev) => ({ ...prev, deadline: event.target.value }))
                  }
                  className="border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                />
                <select
                  value={newTask.assignedTo}
                  onChange={(event) =>
                    setNewTask((prev) => ({ ...prev, assignedTo: event.target.value }))
                  }
                  className="border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                >
                  <option value="">Assign to</option>
                  {memberOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={newTask.description}
                onChange={(event) =>
                  setNewTask((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Task description"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none min-h-[96px]"
              />
            </div>

            <div className="border-t px-4 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                disabled={saving}
                className={`rounded px-3 py-2 text-sm text-white ${
                  saving ? "bg-orange-300 cursor-not-allowed" : "bg-orange-500"
                }`}
              >
                {saving ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showList && (
        <div className="flex-1 overflow-y-auto px-3 lg:px-4 pb-4">
          <div className="rounded-lg border border-gray-200 bg-white p-3 mb-3">
            <div className="flex flex-col lg:flex-row gap-2">
              <input
                type="text"
                placeholder="Search by task title or task number"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none"
              />
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, status: event.target.value }))
                }
                className="border border-gray-300 rounded px-3 py-2 text-sm outline-none"
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input
                type="month"
                value={filters.month}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, month: event.target.value }))
                }
                className="border border-gray-300 rounded px-3 py-2 text-sm outline-none"
              />
              <select
                value={filters.assignedTo}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, assignedTo: event.target.value }))
                }
                className="border border-gray-300 rounded px-3 py-2 text-sm outline-none"
              >
                <option value="">All Assignees</option>
                {memberOptions.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={resetFilters}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                Reset
              </button>
            </div>
          </div>

          {error && !isCreateModalOpen && (
            <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading && (
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
              Loading tasks...
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
              No tasks found for this channel.
            </div>
          )}

          {!loading &&
            sortedGroupKeys.map((groupKey) => {
              const items = groupedTasks[groupKey] || [];
              const isCollapsed = !!collapsedMonths[groupKey];
              return (
                <div key={groupKey} className="rounded-lg border border-gray-200 bg-white mb-3">
                  <button
                    type="button"
                    onClick={() => toggleMonth(groupKey)}
                    className="w-full px-3 py-2 border-b border-gray-100 flex items-center justify-between text-sm font-semibold"
                  >
                    <span>
                      {groupKey === "no-deadline"
                        ? "No Deadline"
                        : normalizeMonthLabel(`${groupKey}-01`)}
                    </span>
                    <span>{isCollapsed ? "+" : "-"}</span>
                  </button>

                  {!isCollapsed && (
                    <div className="p-3 space-y-3">
                      {items.map((task) => {
                        const normalizedTaskNumber = (task.taskNumber || "").toUpperCase();
                        const assigneeId =
                          task.assignedToUser?._id ||
                          task.assignedTo?._id ||
                          task.assignedTo;
                        const creatorName =
                          task.createdByUser?.name ||
                          memberNameMap[task.createdBy?.toString?.()] ||
                          "Unknown";
                        const overdue =
                          task.status !== "Completed" &&
                          moment(task.deadline).isBefore(moment());
                        const isHighlighted = highlightTaskNumber === normalizedTaskNumber;

                        return (
                          <div
                            key={task._id}
                            className={`rounded-lg border p-3 ${
                              overdue ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                            } ${isHighlighted ? "ring-2 ring-orange-300" : ""}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">
                                  {task.taskNumber}
                                </span>
                                <span className="text-sm font-semibold">{task.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    task.status === "Completed"
                                      ? "bg-green-100 text-green-700"
                                      : task.status === "Acknowledged"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {task.status}
                                </span>
                                {overdue && (
                                  <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </div>

                            {task.description && (
                              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap break-words">
                                {task.description}
                              </p>
                            )}

                            <p className="mt-2 text-xs text-gray-500">
                              Created by {creatorName} | Deadline {" "}
                              {moment(task.deadline).format("DD MMM YYYY, HH:mm")}
                            </p>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                              <select
                                value={assigneeId || ""}
                                onChange={(event) =>
                                  patchTask(task._id, { assignedTo: event.target.value })
                                }
                                className="border border-gray-300 rounded px-2 py-2 text-sm outline-none"
                                disabled={updatingTaskId === task._id}
                              >
                                {memberOptions.map((member) => (
                                  <option key={member.id} value={member.id}>
                                    {member.name}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="datetime-local"
                                value={toInputDateTime(task.deadline)}
                                onChange={(event) =>
                                  patchTask(task._id, {
                                    deadline: new Date(event.target.value).toISOString(),
                                  })
                                }
                                className="border border-gray-300 rounded px-2 py-2 text-sm outline-none"
                                disabled={updatingTaskId === task._id}
                              />

                              <select
                                value={task.status}
                                onChange={(event) =>
                                  patchTask(task._id, { status: event.target.value })
                                }
                                className="border border-gray-300 rounded px-2 py-2 text-sm outline-none"
                                disabled={updatingTaskId === task._id}
                              >
                                {STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {updatingTaskId === task._id && (
                              <p className="mt-2 text-xs text-gray-500">Updating task...</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </>
  );
};

export default ChannelTaskManager;
