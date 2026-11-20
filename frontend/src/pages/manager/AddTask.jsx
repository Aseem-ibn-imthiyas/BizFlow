
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Search,
    UserPlus,
    FileText,
    CalendarDays,
    //Tag,
    Save,
    X,
    ChevronDown,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Clock3,
    Flag,
    ClipboardList,
} from 'lucide-react'

import ManagerSidebar from '../../components/sidebar/ManagerSidebar'
import api from '../../services/api'

function AddTask() {
    const navigate = useNavigate()

    const today = new Date().toISOString().slice(0, 10)

    const [task, setTask] = useState({
        title: '',
        description: '',
        category: 'General',
        tags: '',
        priority: 'Medium',
        status: 'Pending',
        startDate: today,
        dueDate: '',
        assignedTo: '',
    })

    const [assignees, setAssignees] = useState([])
    const [loadingAssignees, setLoadingAssignees] = useState(true)
    const [assigneeError, setAssigneeError] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [createdTaskId, setCreatedTaskId] = useState('')

    const activeStaffCount = assignees.length;

    useEffect(() => {
        const fetchAssignees = async () => {
            try {
                setLoadingAssignees(true)
                setAssigneeError('')

                const response = await api.get('/tasks/assignees')

                // Support both Axios response formats:
                // 1. { success: true, count: 2, data: [...] }
                // 2. Directly returned [...]
                const responseBody = response?.data ?? response

                const staffData = Array.isArray(responseBody)
                    ? responseBody
                    : Array.isArray(responseBody?.data)
                        ? responseBody.data
                        : []

                console.log('Employee API response:', response)
                console.log('Loaded employees:', staffData)

                setAssignees(staffData)

            } catch (error) {
                console.error('Employee loading error:', error)

                setAssignees([])

                setAssigneeError(
                    error.response?.data?.message ||
                    error.message ||
                    'Unable to load employees.'
                )

            } finally {
                setLoadingAssignees(false)
            }
        }

        fetchAssignees()
    }, [])

    const updateTask = (field, value) => {
        setTask((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const selectedAssignee = useMemo(
        () => assignees.find(
            (employee) => employee._id === task.assignedTo
        ),
        [assignees, task.assignedTo]
    )

    const validationText = useMemo(() => {
        if (!task.title.trim()) return 'Task title required'
        if (!task.dueDate) return 'Due date required'
        if (task.startDate && task.dueDate < task.startDate) {
            return 'Due date must not be before the start date'
        }
        return 'Ready to create'
    }, [task.title, task.startDate, task.dueDate])

    const createTask = async () => {
        setError('')
        setSuccess('')
        setCreatedTaskId('')

        if (!task.title.trim()) {
            setError('Task title is required.')
            return
        }

        if (!task.dueDate) {
            setError('Please select a task due date.')
            return
        }

        if (
            task.startDate &&
            task.dueDate < task.startDate
        ) {
            setError('Due date cannot be earlier than the start date.')
            return
        }

        if (task.title.trim().length > 150) {
            setError('Task title cannot exceed 150 characters.')
            return
        }

        if (task.description.length > 3000) {
            setError('Task description cannot exceed 3000 characters.')
            return
        }

        const payload = {
            title: task.title.trim(),
            description: task.description.trim(),
            category: task.category,
            tags: task.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            priority: task.priority,
            status: task.status,
            startDate: task.startDate,
            dueDate: task.dueDate,
            assignedTo: task.assignedTo || null,
        }

        setSaving(true)

        try {
            const response = await api.post('/tasks', payload)

            const createdTask = response?.data?.data
            const taskId = createdTask?.taskId || ''

            setCreatedTaskId(taskId)
            setSuccess(
                `Task created successfully${taskId ? ` (${taskId})` : ''}.`
            )

            // Return to Task Management after successful creation.
            navigate('/manager/tasks', {
                state: {
                    successMessage: taskId
                        ? `Task ${taskId} created successfully.`
                        : 'Task created successfully.',
                },
            })
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to create the task.'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">

            <div className="flex h-screen w-full overflow-hidden">

                <ManagerSidebar />

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

                    {/* HEADER */}

                    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#E1E4EA] bg-white px-6 lg:px-8">

                        <div className="relative w-72">
                            <Search
                                size={16}
                                strokeWidth={1.8}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]"
                            />

                            <input
                                type="text"
                                placeholder="Search users, reports, settings..."
                                className="h-9 w-full rounded-md border border-transparent bg-[#F1F3FA] pl-10 pr-4 text-xs text-[#343A47] outline-none transition placeholder:text-[#8B919D] focus:border-[#D4DCF0] focus:bg-white"
                            />
                        </div>

                        <div className="flex items-center gap-5">

                            <button
                                type="button"
                                aria-label="Notifications"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <span className="text-base">♧</span>
                            </button>

                            <button
                                type="button"
                                aria-label="Settings"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <span className="text-base">⚙</span>
                            </button>

                            <div className="h-7 w-px bg-[#E1E4EA]" />

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDE5F5] text-[10px] font-semibold text-[#315A9E]">
                                AU
                            </div>

                        </div>

                    </header>

                    {/* SCROLLABLE CONTENT */}

                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">

                        <div className="px-6 py-7 lg:px-8">

                            {/* PAGE HEADING */}

                            <div>

                                <div className="flex items-center gap-2 text-xs">

                                    <span className="text-[#343A47]">
                                        Home
                                    </span>

                                    <span className="text-[#A1A6B0]">
                                        ›
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/manager/tasks')}
                                        className="text-[#343A47] hover:text-[#0757C9]"
                                    >
                                        Task Management
                                    </button>

                                    <span className="text-[#A1A6B0]">
                                        ›
                                    </span>

                                    <span className="font-medium text-[#0757C9]">
                                        Create Task
                                    </span>

                                </div>

                                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#171B25]">
                                    Create New Task
                                </h1>

                                <p className="mt-1 text-sm text-[#69707D]">
                                    Create a task, assign an employee and manage its priority and deadline.
                                </p>

                            </div>

                            {/* SUCCESS AND ERROR MESSAGES */}

                            {error && (
                                <div
                                    role="alert"
                                    className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                                >
                                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div
                                    role="status"
                                    className="mt-4 flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700"
                                >
                                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                                    {success}
                                    {createdTaskId && (
                                        <span className="font-semibold">
                                            {createdTaskId}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* MAIN GRID */}

                            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">

                                {/* LEFT CONTENT */}

                                <div className="space-y-4">

                                    {/* TASK INFORMATION */}

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-4">

                                            <div className="flex items-center gap-2">
                                                <ClipboardList size={16} className="text-[#0757C9]" />

                                                <h2 className="text-sm font-semibold text-[#242936]">
                                                    Task Information
                                                </h2>
                                            </div>

                                            <span className="text-[9px] text-[#858B97]">
                                                Enter the main task details
                                            </span>

                                        </div>

                                        <div className="mt-4 space-y-4">

                                            <FormField
                                                label="Task Title"
                                                required
                                                value={task.title}
                                                placeholder="e.g. Develop customer management module"
                                                onChange={(value) => updateTask('title', value)}
                                                maxLength={150}
                                            />

                                            <div>

                                                <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                    Task Description
                                                </label>

                                                <textarea
                                                    value={task.description}
                                                    onChange={(e) =>
                                                        updateTask('description', e.target.value)
                                                    }
                                                    placeholder="Describe the task objectives, requirements and expected outcome..."
                                                    rows={5}
                                                    maxLength={3000}
                                                    className="w-full resize-y rounded-md border border-[#D9DDE5] bg-white px-3 py-3 text-xs text-[#343A47] outline-none transition placeholder:text-[#9AA0AA] focus:border-[#0757C9] focus:ring-1 focus:ring-[#0757C9]/10"
                                                />

                                                <p className="mt-1 text-right text-[9px] text-[#858B97]">
                                                    {task.description.length}/3000 characters
                                                </p>

                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                                <SelectField
                                                    label="Task Category"
                                                    value={task.category}
                                                    options={[
                                                        'General',
                                                        'Development',
                                                        'Design',
                                                        'Marketing',
                                                        'Finance',
                                                        'Administration',
                                                        'Human Resources',
                                                        'Operations',
                                                        'Research',
                                                        'Other',
                                                    ]}
                                                    onChange={(value) => updateTask('category', value)}
                                                />

                                                <SelectField
                                                    label="Task Priority"
                                                    value={task.priority}
                                                    options={[
                                                        'Low',
                                                        'Medium',
                                                        'High',
                                                        'Critical',
                                                    ]}
                                                    onChange={(value) => updateTask('priority', value)}
                                                />

                                                <SelectField
                                                    label="Task Status"
                                                    value={task.status}
                                                    options={[
                                                        'Pending',
                                                        'In Progress',
                                                        'Review',
                                                        'Completed',
                                                    ]}
                                                    onChange={(value) => updateTask('status', value)}
                                                />

                                                <div>
                                                    <FormField
                                                        label="Tags"
                                                        value={task.tags}
                                                        placeholder="e.g. frontend, urgent, project"
                                                        onChange={(value) => updateTask('tags', value)}
                                                    />

                                                    <p className="mt-1 text-[9px] text-[#858B97]">
                                                        Separate multiple tags with commas.
                                                    </p>
                                                </div>

                                            </div>

                                        </div>

                                    </section>

                                    {/* SCHEDULE DETAILS */}

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <div className="flex items-center gap-2 border-b border-[#ECEEF2] pb-4">

                                            <CalendarDays size={16} className="text-[#0757C9]" />

                                            <h2 className="text-sm font-semibold text-[#242936]">
                                                Schedule Details
                                            </h2>

                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                                            <FormField
                                                label="Start Date"
                                                type="date"
                                                required
                                                value={task.startDate}
                                                onChange={(value) => updateTask('startDate', value)}
                                            />

                                            <FormField
                                                label="Due Date"
                                                type="date"
                                                required
                                                min={task.startDate || undefined}
                                                value={task.dueDate}
                                                onChange={(value) => updateTask('dueDate', value)}
                                            />

                                        </div>

                                        <p className="mt-3 text-[9px] text-[#858B97]">
                                            Select the expected start and completion dates for this task.
                                        </p>

                                    </section>

                                    {/* ASSIGNMENT DETAILS */}

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-4">

                                            <div className="flex items-center gap-2">
                                                <UserPlus size={16} className="text-[#0757C9]" />

                                                <h2 className="text-sm font-semibold text-[#242936]">
                                                    Employee Assignment
                                                </h2>
                                            </div>

                                            <span className="text-[9px] text-[#858B97]">
                                                Optional
                                            </span>

                                        </div>

                                        <div className="mt-4">

                                            <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                Assign To
                                            </label>

                                            <div className="relative">

                                                <select
                                                    value={task.assignedTo}
                                                    disabled={loadingAssignees}
                                                    onChange={(e) => updateTask('assignedTo', e.target.value)}
                                                    className="h-10 w-full appearance-none rounded-md border border-[#D9DDE5] bg-white px-3 pr-9 text-xs text-[#343A47] outline-none focus:border-[#0757C9] disabled:bg-[#F8F9FC]"
                                                >

                                                    <option value="">
                                                        {loadingAssignees
                                                            ? 'Loading employees...'
                                                            : 'Unassigned'}
                                                    </option>

                                                    {assignees.map((employee) => (
                                                        <option
                                                            key={employee._id}
                                                            value={employee._id}
                                                        >
                                                            {employee.fullName} ({employee.email})
                                                        </option>
                                                    ))}

                                                </select>

                                                <ChevronDown
                                                    size={13}
                                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737A87]"
                                                />

                                            </div>

                                            {loadingAssignees ? (
                                                <p className="mt-2 flex items-center gap-2 text-[9px] text-[#858B97]">
                                                    <Loader2 size={12} className="animate-spin" />
                                                    Loading available employees...
                                                </p>
                                            ) : assigneeError ? (
                                                <p className="mt-2 text-[9px] text-red-600">
                                                    {assigneeError}
                                                </p>
                                            ) : activeStaffCount > 0 ? (
                                                <p className="mt-2 text-[9px] text-[#858B97]">
                                                    {activeStaffCount} active Staff member(s) available for assignment.
                                                </p>
                                            ) : (
                                                <p className="mt-2 text-[9px] text-amber-600">
                                                    No active Staff members are currently available for assignment.
                                                </p>
                                            )}

                                            {selectedAssignee && (
                                                <div className="mt-4 flex items-center gap-3 rounded-md border border-[#E6E8ED] bg-[#F8F9FC] p-3">

                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DDE5F5] text-xs font-semibold text-[#315A9E]">
                                                        {selectedAssignee.fullName
                                                            ?.split(' ')
                                                            .map((part) => part[0])
                                                            .join('')
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-[#343A47]">
                                                            {selectedAssignee.fullName}
                                                        </p>

                                                        <p className="mt-0.5 truncate text-[9px] text-[#858B97]">
                                                            {selectedAssignee.email}
                                                        </p>
                                                    </div>

                                                    <span className="ml-auto rounded-full bg-[#E7EFFD] px-2 py-1 text-[8px] font-medium text-[#0757C9]">
                                                        Staff
                                                    </span>

                                                </div>
                                            )}

                                        </div>

                                    </section>

                                    {/* ADDITIONAL NOTES */}

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <div className="flex items-center gap-2">
                                            <FileText size={15} className="text-[#0757C9]" />

                                            <h2 className="text-sm font-semibold text-[#242936]">
                                                Task Guidelines
                                            </h2>
                                        </div>

                                        <p className="mt-3 text-xs leading-6 text-[#737A87]">
                                            Provide clear task details, select an appropriate priority and deadline, and assign the task to the relevant employee. You can manage task progress from the Task Management dashboard.
                                        </p>

                                    </section>

                                </div>

                                {/* RIGHT SIDE */}

                                <div className="space-y-4">

                                    {/* TASK SUMMARY */}

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <h2 className="text-sm font-semibold text-[#242936]">
                                            Task Summary
                                        </h2>

                                        <div className="mt-5 space-y-4">

                                            <SummaryRow
                                                label="Task ID"
                                                value="Generated automatically"
                                            />

                                            <SummaryRow
                                                label="Priority"
                                                value={task.priority}
                                            />

                                            <SummaryRow
                                                label="Status"
                                                value={task.status}
                                            />

                                            <SummaryRow
                                                label="Category"
                                                value={task.category}
                                            />

                                            <div className="border-t border-[#ECEEF2] pt-4">

                                                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#858B97]">
                                                    Due Date
                                                </p>

                                                <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#343A47]">
                                                    <Clock3 size={14} className="text-[#0757C9]" />
                                                    {task.dueDate || 'Not selected'}
                                                </p>

                                            </div>

                                        </div>

                                    </section>

                                    {/* ASSIGNEE PREVIEW */}

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <div className="flex items-center gap-2">
                                            <UserPlus size={15} className="text-[#0757C9]" />

                                            <h2 className="text-sm font-semibold text-[#242936]">
                                                Assignment Preview
                                            </h2>
                                        </div>

                                        <div className="mt-4">

                                            {selectedAssignee ? (
                                                <>
                                                    <div className="flex items-center gap-3">

                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDE5F5] text-xs font-semibold text-[#315A9E]">
                                                            {selectedAssignee.fullName
                                                                ?.split(' ')
                                                                .map((part) => part[0])
                                                                .join('')
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs font-semibold text-[#343A47]">
                                                                {selectedAssignee.fullName}
                                                            </p>

                                                            <p className="mt-1 truncate text-[9px] text-[#858B97]">
                                                                {selectedAssignee.email}
                                                            </p>
                                                        </div>

                                                    </div>

                                                    <div className="mt-4 rounded-md bg-[#F0F5FF] p-3 text-[10px] leading-5 text-[#315A9E]">
                                                        This employee will be assigned to the task when it is created.
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="rounded-md bg-[#F8F9FC] p-4 text-center">
                                                    <UserPlus
                                                        size={22}
                                                        className="mx-auto text-[#A0A5AE]"
                                                    />

                                                    <p className="mt-2 text-xs font-medium text-[#59606E]">
                                                        No employee selected
                                                    </p>

                                                    <p className="mt-1 text-[9px] text-[#858B97]">
                                                        You can create this task without assigning an employee.
                                                    </p>
                                                </div>
                                            )}

                                        </div>

                                    </section>

                                    {/* PRIORITY GUIDE */}

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5">

                                        <div className="flex items-center gap-2">
                                            <Flag size={15} className="text-[#0757C9]" />

                                            <h2 className="text-sm font-semibold text-[#242936]">
                                                Priority Guide
                                            </h2>
                                        </div>

                                        <div className="mt-4 space-y-3">

                                            <PriorityGuide
                                                color="bg-[#16A34A]"
                                                title="Low"
                                                description="Can be completed when time permits."
                                            />

                                            <PriorityGuide
                                                color="bg-[#D69E24]"
                                                title="Medium"
                                                description="Normal priority task."
                                            />

                                            <PriorityGuide
                                                color="bg-[#EA580C]"
                                                title="High"
                                                description="Requires timely attention."
                                            />

                                            <PriorityGuide
                                                color="bg-[#DC2626]"
                                                title="Critical"
                                                description="Requires immediate attention."
                                            />

                                        </div>

                                    </section>

                                </div>

                            </div>

                            {/* BOTTOM ACTION BAR */}

                            <section className="mt-4 rounded-lg border border-[#E6E8ED] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                                    <div className="flex items-center gap-2 text-[10px] text-[#59606E]">

                                        <AlertCircle size={13} className="text-[#0757C9]" />

                                        <span>Validation:</span>

                                        <span className={
                                            validationText === 'Ready to create'
                                                ? 'text-green-600'
                                                : 'text-red-500'
                                        }>
                                            {validationText}
                                        </span>

                                    </div>

                                    <div className="flex flex-wrap justify-end gap-2">

                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => navigate('/manager/tasks')}
                                            className="flex h-8 items-center gap-1.5 rounded-md border border-[#D9DDE5] px-4 text-[10px] font-medium text-[#454B58] hover:bg-[#F8F9FC] disabled:opacity-50"
                                        >
                                            <X size={12} />
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={createTask}
                                            className="flex h-8 items-center gap-1.5 rounded-md bg-[#0757C9] px-4 text-[10px] font-medium text-white shadow-sm hover:bg-[#0045AD] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {saving
                                                ? <Loader2 size={12} className="animate-spin" />
                                                : <Save size={12} />
                                            }

                                            {saving ? 'Creating Task...' : 'Create Task'}
                                        </button>

                                    </div>

                                </div>

                            </section>

                            {/* FOOTER */}

                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">

                                <div className="flex flex-col gap-3 text-[10px] text-[#59606E] sm:flex-row sm:items-center sm:justify-between">

                                    <p>
                                        © 2026 Business Process Automation System |
                                        Cloud-Based SaaS Platform
                                    </p>

                                    <div className="flex gap-5 text-[#343A47]">
                                        <button type="button">
                                            Privacy Policy
                                        </button>

                                        <button type="button">
                                            Terms of Service
                                        </button>

                                        <button type="button">
                                            Compliance
                                        </button>
                                    </div>

                                </div>

                            </footer>

                        </div>

                    </div>

                </div>

            </div>

        </main>
    )
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
    label,
    required = false,
    value,
    placeholder,
    onChange,
    type = 'text',
    maxLength,
    min,
}) {
    return (
        <div>

            <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                {label}

                {required && (
                    <span className="ml-1 text-red-500">*</span>
                )}
            </label>

            <input
                type={type}
                value={value}
                placeholder={placeholder}
                maxLength={maxLength}
                min={min}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 w-full rounded-md border border-[#D9DDE5] bg-white px-3 text-xs text-[#343A47] outline-none transition placeholder:text-[#9AA0AA] focus:border-[#0757C9] focus:ring-1 focus:ring-[#0757C9]/10"
            />

        </div>
    )
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
    label,
    value,
    options,
    onChange,
}) {
    return (
        <div>

            <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                {label}
            </label>

            <div className="relative">

                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-9 w-full appearance-none rounded-md border border-[#D9DDE5] bg-white px-3 pr-8 text-xs text-[#343A47] outline-none focus:border-[#0757C9]"
                >
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    size={13}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737A87]"
                />

            </div>

        </div>
    )
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-3">

            <span className="text-[10px] text-[#737A87]">
                {label}
            </span>

            <span className="text-right text-[10px] font-semibold text-[#343A47]">
                {value}
            </span>

        </div>
    )
}

/* =========================================================
   PRIORITY GUIDE
========================================================= */

function PriorityGuide({
    color,
    title,
    description,
}) {
    return (
        <div className="flex items-start gap-2.5">

            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${color}`} />

            <div>
                <p className="text-[10px] font-semibold text-[#343A47]">
                    {title}
                </p>

                <p className="mt-0.5 text-[9px] leading-4 text-[#858B97]">
                    {description}
                </p>
            </div>

        </div>
    )
}

export default AddTask
