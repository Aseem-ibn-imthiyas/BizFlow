import { useEffect, useState } from 'react'
import {
    Bell,
    CircleHelp,
    Search,
    Headphones,
    BookOpen,
    Bug,
    ChevronRight,
    ChevronDown,
    CheckCircle2,
    Clock3,
    AlertTriangle,
    Plus,
    MessageSquare,
} from 'lucide-react'

import AdminSidebar from '../../components/sidebar/AdminSidebar'

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '')

function SupportCenter() {

    const [supportRequests, setSupportRequests] = useState([])
    const [loadingTickets, setLoadingTickets] = useState(true)
    const [ticketError, setTicketError] = useState('')

    const [showTicketForm, setShowTicketForm] = useState(false)
    const [submittingTicket, setSubmittingTicket] = useState(false)
    const [ticketFormError, setTicketFormError] = useState('')
    const [ticketFormSuccess, setTicketFormSuccess] = useState('')

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [loadingTicketDetails, setLoadingTicketDetails] = useState(false)
    const [ticketDetailsError, setTicketDetailsError] = useState('')

    const [ticketForm, setTicketForm] = useState({
        subject: '',
        category: 'General',
        description: '',
        priority: 'Medium',
        requesterName: 'Admin User',
        requesterEmail: '',
    })

    useEffect(() => {
        const fetchSupportTickets = async () => {
            try {
                setLoadingTickets(true)
                setTicketError('')

                const response = await fetch(
                    'http://localhost:5000/api/support-tickets'
                )

                const result = await response.json()

                if (!response.ok || result.success === false) {
                    throw new Error(
                        result.message || 'Failed to fetch support tickets.'
                    )
                }

                // Supports either { success: true, data: [...] }
                // or a direct array response.
                const tickets = Array.isArray(result)
                    ? result
                    : result.data ?? result.tickets ?? []

                setSupportRequests(tickets)
            } catch (error) {
                console.error('Error fetching support tickets:', error)
                setTicketError(error.message || 'Unable to load support tickets.')
            } finally {
                setLoadingTickets(false)
            }
        }

        fetchSupportTickets()
    }, [])

    const handleTicketFormChange = (event) => {
        const { name, value } = event.target

        setTicketForm((previous) => ({
            ...previous,
            [name]: value,
        }))
    }

    const handleTicketSubmit = async (event) => {
        event.preventDefault()

        setTicketFormError('')
        setTicketFormSuccess('')

        if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
            setTicketFormError('Subject and description are required.')
            return
        }

        try {
            setSubmittingTicket(true)

            const response = await fetch(
                'http://localhost:5000/api/support-tickets',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...ticketForm,
                        subject: ticketForm.subject.trim(),
                        description: ticketForm.description.trim(),
                    }),
                }
            )

            const result = await response.json()

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.message || 'Failed to create support ticket.'
                )
            }

            // Refresh the ticket list from MongoDB.
            const ticketsResponse = await fetch(
                'http://localhost:5000/api/support-tickets'
            )

            const ticketsResult = await ticketsResponse.json()

            if (!ticketsResponse.ok || ticketsResult.success === false) {
                throw new Error(
                    ticketsResult.message || 'Ticket created, but the list could not be refreshed.'
                )
            }

            const tickets = Array.isArray(ticketsResult)
                ? ticketsResult
                : ticketsResult.tickets ?? ticketsResult.data ?? []

            setSupportRequests(tickets)
            setShowTicketForm(false)

            setTicketForm({
                subject: '',
                category: 'General',
                description: '',
                priority: 'Medium',
                requesterName: 'Admin User',
                requesterEmail: '',
            })

            setTicketFormSuccess(
                result.message || 'Support ticket created successfully.'
            )
        } catch (error) {
            console.error('Error creating support ticket:', error)
            setTicketFormError(error.message || 'Unable to create support ticket.')
        } finally {
            setSubmittingTicket(false)
        }
    }



    useEffect(() => {
        const controller = new AbortController()

        const loadTickets = async () => {
            setLoadingTickets(true)
            setTicketError('')

            try {
                const params = new URLSearchParams()

                if (searchTerm.trim()) {
                    params.set('search', searchTerm.trim())
                }

                if (statusFilter !== 'All') {
                    params.set('status', statusFilter)
                }

                const query = params.toString()
                const url = `${API_BASE_URL}/api/support-tickets${query ? `?${query}` : ''}`

                const response = await fetch(url, {
                    signal: controller.signal,
                })

                const result = await response.json()

                if (!response.ok || result.success === false) {
                    throw new Error(
                        result.message || 'Unable to load support tickets.'
                    )
                }

                const tickets = Array.isArray(result)
                    ? result
                    : result.tickets || result.data || []

                setSupportRequests(tickets)
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setTicketError(error.message || 'Unable to load support tickets.')
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingTickets(false)
                }
            }
        }

        const timeoutId = setTimeout(loadTickets, 300)

        return () => {
            clearTimeout(timeoutId)
            controller.abort()
        }
    }, [searchTerm, statusFilter])



    const handleViewTicket = async (request) => {
        setSelectedTicket(request)
        setTicketDetailsError('')
        setLoadingTicketDetails(true)

        try {
            const identifier = request._id || request.id

            if (!identifier) {
                throw new Error('This ticket has no database ID.')
            }

            const response = await fetch(
                `${API_BASE_URL}/api/support-tickets/${encodeURIComponent(identifier)}`
            )

            const result = await response.json()

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.message || 'Unable to load ticket details.'
                )
            }

            const ticket = result.ticket || result.data || result

            setSelectedTicket(ticket)
        } catch (error) {
            setTicketDetailsError(
                error.message || 'Unable to load ticket details.'
            )
        } finally {
            setLoadingTicketDetails(false)
        }
    }


    const knowledgeArticles = [
        {
            title: 'How do I create a new user?',
            description: 'Step-by-step account onboarding and invitation setup',
        },
        {
            title: 'How do I assign a role to a user?',
            description: 'Role hierarchy, scope overrides, and departmental assignment',
        },
        {
            title: "How do I reset a user's password?",
            description: 'Temporary security link dispatch and 2FA reset procedures',
        },
        {
            title: 'How do I create a workflow?',
            description: 'Trigger conditions, node configurations, and execution test flows',
        },
        {
            title: 'How do I disable a user account?',
            description: 'Graceful session revocation and audit logging',
        },
        {
            title: 'How do I view automation logs?',
            description: 'Real-time execution filtering, error codes, and audit trail',
        },
        {
            title: 'How do I manage permissions?',
            description: 'Granular RBAC definitions and matrix mapping',
        },
        {
            title: 'How do I check system health?',
            description: 'Service latency, queue depths, and uptime telemetry',
        },
    ]

    const faqItems = [
        'How do I create a new user?',
        "How can I change a user's role?",
        'How do I deactivate a user?',
        'Where can I view automation logs?',
        'How can I check system health?',
        'How do I troubleshoot a failed workflow?',
        'How do I contact support?',
    ]

    const supportStatus = [
        {
            label: 'Authentication',
            value: '99.99%',
        },
        {
            label: 'User Management',
            value: '100.0%',
        },
        {
            label: 'Workflow Automation',
            value: '99.98%',
        },
        {
            label: 'Reports & Analytics',
            value: '100.0%',
        },
        {
            label: 'Notifications & Webhooks',
            value: '99.95%',
        },
        {
            label: 'System Health Engine',
            value: '100.0%',
        },
    ]


    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">

                {/* =====================================================
                    ADMIN SIDEBAR
                ====================================================== */}
                <AdminSidebar />

                {/* =====================================================
                    RIGHT SIDE
                ====================================================== */}
                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

                    {/* =================================================
                        HEADER
                    ================================================== */}
                    <header
                        className="
                            sticky
                            top-0
                            z-20
                            flex
                            h-16
                            shrink-0
                            items-center
                            justify-between
                            border-b
                            border-[#E1E4EA]
                            bg-white
                            px-6
                            lg:px-8
                        "
                    >
                        {/* Search */}
                        <div className="relative w-72">
                            <Search
                                size={16}
                                strokeWidth={1.8}
                                className="
                                    pointer-events-none
                                    absolute
                                    left-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-[#7D8491]
                                "
                            />

                            <input
                                type="text"
                                placeholder="Search users, reports, settings..."
                                className="
                                    h-9
                                    w-full
                                    rounded-md
                                    border
                                    border-transparent
                                    bg-[#F1F3FA]
                                    pl-10
                                    pr-4
                                    text-xs
                                    text-[#343A47]
                                    outline-none
                                    transition
                                    placeholder:text-[#8B919D]
                                    focus:border-[#D4DCF0]
                                    focus:bg-white
                                "
                            />
                        </div>

                        {/* Header Right */}
                        <div className="flex items-center gap-5">

                            <button
                                type="button"
                                aria-label="Notifications"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Bell size={18} strokeWidth={1.7} />
                            </button>

                            <button
                                type="button"
                                aria-label="Help"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <CircleHelp
                                    size={18}
                                    strokeWidth={1.7}
                                />
                            </button>

                            <div className="h-7 w-px bg-[#E1E4EA]" />

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-[#242936]">
                                        Admin User
                                    </p>

                                    <p className="text-[9px] font-medium tracking-wide text-[#737A87]">
                                        SYSTEM ADMIN
                                    </p>
                                </div>

                                <div
                                    className="
                                        flex
                                        h-9
                                        w-9
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-[#DDE5F5]
                                        text-xs
                                        font-semibold
                                        text-[#315A9E]
                                    "
                                >
                                    AU
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* =================================================
                        SCROLLABLE CONTENT
                    ================================================== */}
                    <div
                        className="
                            min-h-0
                            flex-1
                            overflow-x-hidden
                            overflow-y-auto
                        "
                    >
                        <div className="px-6 py-7 lg:px-8">

                            {/* =================================================
                                PAGE HEADER
                            ================================================== */}
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                                <div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-[#343A47]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            /
                                        </span>

                                        <span className="font-medium text-[#0757C9]">
                                            Support
                                        </span>
                                    </div>

                                    <h2
                                        className="
                                            mt-2
                                            text-2xl
                                            font-bold
                                            tracking-tight
                                            text-[#171B25]
                                        "
                                    >
                                        Support Center
                                    </h2>

                                    <p className="mt-1 text-sm text-[#69707D]">
                                        Get help with BIZFLOW, find answers,
                                        report issues, or contact the support team.
                                    </p>
                                </div>
                            </div>

                            {/* =================================================
                                KNOWLEDGE & ASSISTANCE
                            ================================================== */}
                            <section
                                className="
                                    mt-6
                                    rounded-lg
                                    border
                                    border-[#E6E8ED]
                                    bg-white
                                    p-5
                                    shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                "
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className="
                                            flex
                                            items-center
                                            gap-1.5
                                            rounded-full
                                            bg-[#EEF4FF]
                                            px-2.5
                                            py-1
                                            text-[9px]
                                            font-semibold
                                            uppercase
                                            tracking-wide
                                            text-[#0757C9]
                                        "
                                    >
                                        <BookOpen
                                            size={11}
                                            strokeWidth={2}
                                        />

                                        Knowledge & Assistance
                                    </span>
                                </div>

                                <h3 className="mt-3 text-lg font-semibold text-[#242936]">
                                    How can we help?
                                </h3>

                                <p className="mt-1 text-xs text-[#7A808C]">
                                    Find answers, helpful resources, or contact
                                    our support team for assistance with BIZFLOW.
                                </p>

                                <div className="relative mt-4 max-w-2xl">
                                    <Search
                                        size={15}
                                        strokeWidth={1.8}
                                        className="
                                            pointer-events-none
                                            absolute
                                            left-3
                                            top-1/2
                                            -translate-y-1/2
                                            text-[#7D8491]
                                        "
                                    />

                                    <input
                                        type="text"
                                        placeholder="Search users, workflows, permissions, automation, reports, system settings..."
                                        className="
                                            h-10
                                            w-full
                                            rounded-md
                                            border
                                            border-[#DDE1E8]
                                            bg-white
                                            pl-10
                                            pr-4
                                            text-xs
                                            text-[#343A47]
                                            outline-none
                                            transition
                                            placeholder:text-[#8B919D]
                                            focus:border-[#AFC4EA]
                                        "
                                    />
                                </div>

                                <p className="mt-2 text-[9px] font-medium text-[#7A808C]">
                                    Search our knowledge base and support resources.
                                </p>
                            </section>

                            {/* =================================================
                                HELP CARDS
                            ================================================== */}
                            <section
                                className="
                                    mt-5
                                    overflow-hidden
                                    rounded-lg
                                    border
                                    border-[#E6E8ED]
                                    bg-white
                                    shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                "
                            >
                                <div
                                    className="
                                        flex
                                        flex-col
                                        gap-3
                                        border-b
                                        border-[#E6E8ED]
                                        px-5
                                        py-4
                                        sm:flex-row
                                        sm:items-center
                                        sm:justify-between
                                    "
                                >
                                    <div>
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            My Support Requests
                                        </h3>

                                        <p className="mt-0.5 text-[10px] text-[#7A808C]">
                                            Track and communicate on your active
                                            administrative assistance tickets.
                                        </p>
                                    </div>


                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <div className="relative min-w-0 flex-1 sm:w-48 sm:flex-none">
                                            <Search
                                                size={13}
                                                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7D8491]"
                                            />

                                            <input
                                                type="search"
                                                value={searchTerm}
                                                onChange={(event) => setSearchTerm(event.target.value)}
                                                placeholder="Search tickets..."
                                                aria-label="Search support tickets"
                                                className="h-8 w-full rounded-md border border-[#DDE1E8] bg-white pl-8 pr-3 text-[10px] text-[#343A47] outline-none focus:border-[#0757C9]"
                                            />
                                        </div>

                                        <select
                                            value={statusFilter}
                                            onChange={(event) => setStatusFilter(event.target.value)}
                                            aria-label="Filter support tickets by status"
                                            className="h-8 rounded-md border border-[#DDE1E8] bg-white px-2 text-[10px] text-[#59606E] outline-none focus:border-[#0757C9]"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Open">Open</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Resolved">Resolved</option>
                                            <option value="Closed">Closed</option>
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTicketFormError('')
                                                setTicketFormSuccess('')
                                                setShowTicketForm(true)
                                            }}
                                            className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#0052CC] px-3 text-[9px] font-medium text-white"
                                        >
                                            <Plus size={12} />
                                            New Ticket
                                        </button>
                                    </div>

                                </div>

                                {/* Desktop Table */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full min-w-190 border-collapse">
                                        <thead>
                                            <tr className="bg-[#F8F9FC]">
                                                <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                    Ticket ID
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                    Subject
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                    Category
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                    Created
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                    Priority
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                    Status
                                                </th>

                                                <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {loadingTickets ? (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="px-5 py-8 text-center text-xs text-[#69707D]"
                                                    >
                                                        Loading support tickets...
                                                    </td>
                                                </tr>
                                            ) : ticketError ? (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="px-5 py-8 text-center text-xs text-red-600"
                                                    >
                                                        {ticketError}
                                                    </td>
                                                </tr>
                                            ) : supportRequests.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="px-5 py-8 text-center text-xs text-[#69707D]"
                                                    >
                                                        No support tickets found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                supportRequests.map((request) => (
                                                    <tr
                                                        key={request._id || request.ticketId || request.id}
                                                        className="border-t border-[#ECEEF2]"
                                                    >
                                                        <td className="px-5 py-3 text-[9px] font-semibold text-[#0757C9]">
                                                            {request.ticketId || request.id || '—'}
                                                        </td>

                                                        <td className="px-4 py-3 text-[10px] text-[#343A47]">
                                                            {request.subject}
                                                        </td>

                                                        <td className="px-4 py-3 text-[9px] text-[#59606E]">
                                                            {request.category}
                                                        </td>

                                                        <td className="px-4 py-3 text-[9px] text-[#59606E]">
                                                            {request.createdAt
                                                                ? new Date(request.createdAt).toLocaleDateString(
                                                                    'en-GB',
                                                                    {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                    }
                                                                )
                                                                : request.created || '—'}
                                                        </td>

                                                        <td className="px-4 py-3 text-[9px] font-medium text-[#DC2626]">
                                                            {request.priority || 'Medium'}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <span className="rounded-full bg-[#EAF2FF] px-2 py-1 text-[8px] font-semibold text-[#0757C9]">
                                                                {request.status || 'Open'}
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleViewTicket(request)}
                                                                className="text-[9px] font-semibold text-[#0757C9] hover:underline"
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>


                                {/* Mobile */}
                                <div className="divide-y divide-[#ECEEF2] md:hidden">
                                    {loadingTickets ? (
                                        <div className="p-6 text-center text-xs text-[#8B919D]">
                                            Loading support tickets...
                                        </div>
                                    ) : ticketError ? (
                                        <div className="p-4 text-xs text-red-600">
                                            {ticketError}
                                        </div>
                                    ) : supportRequests.length === 0 ? (
                                        <div className="p-6 text-center">
                                            <MessageSquare
                                                size={24}
                                                className="mx-auto mb-2 text-[#8B919D]"
                                            />
                                            <p className="text-xs font-semibold text-[#343A47]">
                                                No support tickets found
                                            </p>
                                            <p className="mt-1 text-[10px] text-[#8B919D]">
                                                Your submitted support requests will appear here.
                                            </p>
                                        </div>
                                    ) : (
                                        supportRequests.map((request) => (
                                            <div
                                                key={request._id || request.ticketId || request.id}
                                                className="p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-semibold text-[#0757C9]">
                                                            {request.ticketId || request.id || '—'}
                                                        </p>

                                                        <p className="mt-1 wrap-break-word text-xs font-medium text-[#343A47]">
                                                            {request.subject || 'Untitled request'}
                                                        </p>
                                                    </div>

                                                    <span className="shrink-0 rounded-full bg-[#EAF2FF] px-2 py-1 text-[8px] font-semibold text-[#0757C9]">
                                                        {request.status || 'Open'}
                                                    </span>
                                                </div>

                                                <div className="mt-3 grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-[8px] uppercase text-[#8B919D]">
                                                            Category
                                                        </p>
                                                        <p className="mt-1 text-[9px] text-[#59606E]">
                                                            {request.category || 'General'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[8px] uppercase text-[#8B919D]">
                                                            Priority
                                                        </p>
                                                        <p className="mt-1 text-[9px] font-medium text-[#DC2626]">
                                                            {request.priority || 'Medium'}
                                                        </p>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <p className="text-[8px] uppercase text-[#8B919D]">
                                                            Submitted
                                                        </p>
                                                        <p className="mt-1 text-[9px] text-[#59606E]">
                                                            {request.createdAt
                                                                ? new Date(request.createdAt).toLocaleString()
                                                                : 'Date unavailable'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleViewTicket(request)}
                                                    className="mt-3 text-[9px] font-semibold text-[#0757C9]"
                                                >
                                                    View Request →
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                            </section>

                            {/* =================================================
                                KNOWLEDGE BASE + SYSTEM STATUS
                            ================================================== */}
                            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">

                                {/* Knowledge Base */}
                                <section
                                    className="
                                        overflow-hidden
                                        rounded-lg
                                        border
                                        border-[#E6E8ED]
                                        bg-white
                                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    "
                                >
                                    <div
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            border-b
                                            border-[#E6E8ED]
                                            px-5
                                            py-4
                                        "
                                    >
                                        <div>
                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Knowledge Base
                                            </h3>

                                            <p className="mt-0.5 text-[10px] text-[#7A808C]">
                                                Quick answers to common BIZFLOW administration questions.
                                            </p>
                                        </div>

                                        <span
                                            className="
                                                rounded
                                                bg-[#EEF4FF]
                                                px-2
                                                py-1
                                                text-[9px]
                                                font-semibold
                                                text-[#0757C9]
                                            "
                                        >
                                            8 Selected Articles
                                        </span>
                                    </div>

                                    <div>
                                        {knowledgeArticles.map((article) => (
                                            <button
                                                key={article.title}
                                                type="button"
                                                className="
                                                    flex
                                                    w-full
                                                    items-center
                                                    justify-between
                                                    border-b
                                                    border-[#ECEEF2]
                                                    px-5
                                                    py-3
                                                    text-left
                                                    transition
                                                    hover:bg-[#FAFBFE]
                                                "
                                            >
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <BookOpen
                                                        size={14}
                                                        strokeWidth={1.7}
                                                        className="mt-0.5 shrink-0 text-[#59606E]"
                                                    />

                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-[#343A47]">
                                                            {article.title}
                                                        </p>

                                                        <p className="mt-0.5 truncate text-[10px] text-[#7A808C]">
                                                            {article.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <ChevronRight
                                                    size={14}
                                                    strokeWidth={1.7}
                                                    className="shrink-0 text-[#7A808C]"
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="px-5 py-4 text-center">
                                        <button
                                            type="button"
                                            className="text-[10px] font-semibold text-[#0757C9]"
                                        >
                                            View All Articles (42) →
                                        </button>
                                    </div>
                                </section>

                                {/* System Status */}
                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E6E8ED]
                                        bg-white
                                        p-5
                                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    "
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            BIZFLOW System Status
                                        </h3>

                                        <span
                                            className="
                                                flex
                                                items-center
                                                gap-1
                                                rounded-full
                                                bg-[#ECFDF3]
                                                px-2
                                                py-1
                                                text-[8px]
                                                font-semibold
                                                text-[#159447]
                                            "
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#18A957]" />
                                            All Operational
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {supportStatus.map((service) => (
                                            <div
                                                key={service.label}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2
                                                        size={13}
                                                        strokeWidth={1.8}
                                                        className="text-[#18A957]"
                                                    />

                                                    <span className="text-[10px] text-[#424854]">
                                                        {service.label}
                                                    </span>
                                                </div>

                                                <span className="text-[9px] font-semibold text-[#159447]">
                                                    {service.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        className="
                                            mt-5
                                            text-[10px]
                                            font-semibold
                                            text-[#0757C9]
                                        "
                                    >
                                        View Detailed System Status →
                                    </button>
                                </section>
                            </div>

                            {/* =================================================
                                FAQ + SUPPORT AVAILABILITY
                            ================================================== */}
                            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">

                                {/* FAQ */}
                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E6E8ED]
                                        bg-white
                                        p-5
                                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    "
                                >
                                    <h3 className="text-sm font-semibold text-[#242936]">
                                        Frequently Asked Questions
                                    </h3>

                                    <p className="mt-0.5 text-[10px] text-[#7A808C]">
                                        Find immediate answers to our most common support requests.
                                    </p>

                                    <div className="mt-4 space-y-2">

                                        {faqItems.map((question, index) => (
                                            <div
                                                key={question}
                                                className="
                                                    overflow-hidden
                                                    rounded-md
                                                    border
                                                    border-[#E1E4EA]
                                                "
                                            >
                                                <button
                                                    type="button"
                                                    className="
                                                        flex
                                                        min-h-9
                                                        w-full
                                                        items-center
                                                        justify-between
                                                        px-3
                                                        text-left
                                                        transition
                                                        hover:bg-[#FAFBFE]
                                                    "
                                                >
                                                    <span className="text-[10px] font-medium text-[#343A47]">
                                                        {question}
                                                    </span>

                                                    <ChevronDown
                                                        size={13}
                                                        strokeWidth={1.7}
                                                        className="text-[#59606E]"
                                                    />
                                                </button>

                                                {index === 0 && (
                                                    <div className="border-t border-[#E6E8ED] bg-[#FAFBFE] px-3 py-3">
                                                        <p className="text-[10px] leading-4 text-[#69707D]">
                                                            To onboard a new team member into
                                                            the BIZFLOW tenant:
                                                        </p>

                                                        <ul className="mt-2 space-y-1 pl-4 text-[9px] leading-4 text-[#69707D]">
                                                            <li>
                                                                Navigate to User Management
                                                                in the left navigation menu.
                                                            </li>

                                                            <li>
                                                                Click the primary + Add User
                                                                button located at the top-right corner.
                                                            </li>

                                                            <li>
                                                                Fill in the corporate email
                                                                address, full name, and initial
                                                                organization unit.
                                                            </li>

                                                            <li>
                                                                Assign the appropriate role
                                                                profile.
                                                            </li>

                                                            <li>
                                                                Click Send Invitation to dispatch
                                                                an activation link.
                                                            </li>
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                    </div>
                                </section>

                                {/* Right Side Support */}
                                <div className="space-y-5">

                                    {/* Support Availability */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E6E8ED]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Support Availability
                                        </h3>

                                        <p className="mt-3 text-[9px] font-semibold uppercase tracking-wide text-[#7A808C]">
                                            Standard Support Hours
                                        </p>

                                        <p className="mt-1 text-[10px] font-medium text-[#343A47]">
                                            Monday – Friday: 8:30 AM – 5:30 PM (EST)
                                        </p>

                                        <div
                                            className="
                                                mt-4
                                                rounded-md
                                                border
                                                border-[#DDE5F2]
                                                bg-[#F8FAFE]
                                                p-3
                                            "
                                        >
                                            <div className="flex items-center gap-2">
                                                <Clock3
                                                    size={14}
                                                    className="text-[#0757C9]"
                                                />

                                                <span className="text-[10px] font-semibold text-[#343A47]">
                                                    Response SLA
                                                </span>
                                            </div>

                                            <p className="mt-1 text-[9px] text-[#7A808C]">
                                                Typical ticket review & triage within
                                                <span className="font-semibold text-[#343A47]">
                                                    {' '}1 business day
                                                </span>
                                            </p>
                                        </div>

                                        <div
                                            className="
                                                mt-3
                                                rounded-md
                                                border
                                                border-[#F4D59C]
                                                bg-[#FFF9EC]
                                                p-3
                                            "
                                        >
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle
                                                    size={14}
                                                    className="text-[#D97706]"
                                                />

                                                <span className="text-[10px] font-semibold text-[#A85B00]">
                                                    For Critical Issues
                                                </span>
                                            </div>

                                            <p className="mt-1 text-[9px] leading-4 text-[#8A6A32]">
                                                Use the Critical priority flag when
                                                submitting a support request that
                                                prevents essential business operations.
                                            </p>
                                        </div>
                                    </section>

                                    {/* Admin Quick Tip */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#BFD3F6]
                                            bg-[#EEF4FF]
                                            p-5
                                        "
                                    >
                                        <div className="flex items-center gap-2">
                                            <MessageSquare
                                                size={14}
                                                className="text-[#0757C9]"
                                            />

                                            <h3 className="text-xs font-semibold text-[#0757C9]">
                                                Admin Quick Tip
                                            </h3>
                                        </div>

                                        <p className="mt-2 text-[9px] leading-4 text-[#59606E]">
                                            Always attach log execution correlation IDs
                                            found in Automation Logs when creating a
                                            technical ticket to speed up diagnostics.
                                        </p>
                                    </section>

                                </div>
                            </div>

                            {/* =================================================
                                STILL NEED HELP
                            ================================================== */}
                            <section
                                className="
                                    mt-5
                                    rounded-lg
                                    border
                                    border-[#E6E8ED]
                                    bg-white
                                    p-5
                                    shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                "
                            >
                                <h3 className="text-sm font-semibold text-[#242936]">
                                    Still need help?
                                </h3>

                                <p className="mt-1 text-[10px] text-[#7A808C]">
                                    Our support team is available to help you resolve
                                    technical issues and answer questions about BIZFLOW.
                                </p>

                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

                                    {/* Technical Support */}
                                    <div
                                        className="
                                            rounded-md
                                            border
                                            border-[#E1E4EA]
                                            bg-[#FAFBFD]
                                            p-4
                                        "
                                    >
                                        <div
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-[#EEF4FF]
                                                text-[#0757C9]
                                            "
                                        >
                                            <Headphones
                                                size={15}
                                                strokeWidth={1.8}
                                            />
                                        </div>

                                        <h4 className="mt-3 text-xs font-semibold text-[#343A47]">
                                            Technical Support
                                        </h4>

                                        <p className="mt-1 text-[9px] leading-4 text-[#7A808C]">
                                            Get help with technical problems,
                                            errors, or system issues.
                                        </p>

                                        <button
                                            type="button"
                                            className="
                                                mt-4
                                                flex
                                                h-8
                                                w-full
                                                items-center
                                                justify-center
                                                rounded-md
                                                border
                                                border-[#DDE1E8]
                                                bg-white
                                                text-[9px]
                                                font-semibold
                                                text-[#343A47]
                                            "
                                        >
                                            Contact Technical Support
                                        </button>
                                    </div>

                                    {/* Documentation */}
                                    <div
                                        className="
                                            rounded-md
                                            border
                                            border-[#E1E4EA]
                                            bg-[#FAFBFD]
                                            p-4
                                        "
                                    >
                                        <div
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-[#EEF4FF]
                                                text-[#0757C9]
                                            "
                                        >
                                            <BookOpen
                                                size={15}
                                                strokeWidth={1.8}
                                            />
                                        </div>

                                        <h4 className="mt-3 text-xs font-semibold text-[#343A47]">
                                            Documentation
                                        </h4>

                                        <p className="mt-1 text-[9px] leading-4 text-[#7A808C]">
                                            Browse detailed guides and full API
                                            documentation.
                                        </p>

                                        <button
                                            type="button"
                                            className="
                                                mt-4
                                                flex
                                                h-8
                                                w-full
                                                items-center
                                                justify-center
                                                rounded-md
                                                border
                                                border-[#DDE1E8]
                                                bg-white
                                                text-[9px]
                                                font-semibold
                                                text-[#343A47]
                                            "
                                        >
                                            Open Documentation
                                        </button>
                                    </div>

                                    {/* Report Issue */}
                                    <div
                                        className="
                                            rounded-md
                                            border
                                            border-[#E1E4EA]
                                            bg-[#FAFBFD]
                                            p-4
                                        "
                                    >
                                        <div
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-[#EEF4FF]
                                                text-[#0757C9]
                                            "
                                        >
                                            <Bug
                                                size={15}
                                                strokeWidth={1.8}
                                            />
                                        </div>

                                        <h4 className="mt-3 text-xs font-semibold text-[#343A47]">
                                            Report an Issue
                                        </h4>

                                        <p className="mt-1 text-[9px] leading-4 text-[#7A808C]">
                                            Report a technical problem or unexpected
                                            system behavior.
                                        </p>

                                        <button
                                            type="button"
                                            className="
                                                mt-4
                                                flex
                                                h-8
                                                w-full
                                                items-center
                                                justify-center
                                                rounded-md
                                                border
                                                border-[#DDE1E8]
                                                bg-white
                                                text-[9px]
                                                font-semibold
                                                text-[#343A47]
                                            "
                                        >
                                            Report an Issue
                                        </button>
                                    </div>

                                </div>
                            </section>

                            {/* =================================================
                                MY SUPPORT REQUESTS
                            ================================================== */}


                            {ticketFormSuccess && (
                                <div
                                    role="status"
                                    aria-live="polite"
                                    className="flex items-start gap-3 border-b border-emerald-200 bg-emerald-50 px-5 py-3"
                                >
                                    <CheckCircle2
                                        size={18}
                                        className="mt-0.5 shrink-0 text-emerald-600"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-emerald-800">
                                            Ticket created successfully
                                        </p>
                                        <p className="mt-1 wrap-break-word text-xs text-emerald-700">
                                            {ticketFormSuccess}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setTicketFormSuccess('')}
                                        aria-label="Dismiss success notification"
                                        className="shrink-0 rounded-md p-1 text-emerald-700 transition hover:bg-emerald-100"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}


                            {selectedTicket && (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-6"
                                    onClick={(event) => {
                                        if (event.target === event.currentTarget) {
                                            setSelectedTicket(null)
                                        }
                                    }}
                                >
                                    <section
                                        role="dialog"
                                        aria-modal="true"
                                        aria-labelledby="ticket-details-title"
                                        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[#E6E8ED] bg-white shadow-xl"
                                    >
                                        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-[#E6E8ED] bg-white px-5 py-4">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold text-[#0757C9]">
                                                    {selectedTicket.ticketId || 'Support Ticket'}
                                                </p>

                                                <h2
                                                    id="ticket-details-title"
                                                    className="mt-1 wrap-break-word text-base font-semibold text-[#242936]"
                                                >
                                                    {selectedTicket.subject || 'Ticket Details'}
                                                </h2>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setSelectedTicket(null)}
                                                aria-label="Close ticket details"
                                                className="rounded-md px-2 py-1 text-lg text-[#59606E] hover:bg-[#F3F5F8]"
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <div className="space-y-5 p-5">
                                            {loadingTicketDetails ? (
                                                <p className="text-xs text-[#7A808C]">
                                                    Loading ticket details...
                                                </p>
                                            ) : ticketDetailsError ? (
                                                <p role="alert" className="text-xs text-red-600">
                                                    {ticketDetailsError}
                                                </p>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                        <div>
                                                            <p className="text-[9px] uppercase tracking-wide text-[#8B919D]">
                                                                Status
                                                            </p>
                                                            <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                                                {selectedTicket.status || 'Open'}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[9px] uppercase tracking-wide text-[#8B919D]">
                                                                Priority
                                                            </p>
                                                            <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                                                {selectedTicket.priority || 'Medium'}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[9px] uppercase tracking-wide text-[#8B919D]">
                                                                Category
                                                            </p>
                                                            <p className="mt-1 text-xs text-[#343A47]">
                                                                {selectedTicket.category || 'General'}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[9px] uppercase tracking-wide text-[#8B919D]">
                                                                Assigned To
                                                            </p>
                                                            <p className="mt-1 wrap-break-word text-xs text-[#343A47]">
                                                                {selectedTicket.assignedTo || 'Unassigned'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-[#ECEEF2] pt-4">
                                                        <h3 className="text-xs font-semibold text-[#343A47]">
                                                            Description
                                                        </h3>
                                                        <p className="mt-2 whitespace-pre-wrap wrap-break-word text-xs leading-5 text-[#59606E]">
                                                            {selectedTicket.description || 'No description provided.'}
                                                        </p>
                                                    </div>

                                                    <div className="border-t border-[#ECEEF2] pt-4">
                                                        <h3 className="text-xs font-semibold text-[#343A47]">
                                                            Requester
                                                        </h3>
                                                        <p className="mt-2 text-xs text-[#343A47]">
                                                            {selectedTicket.requesterName || 'Not provided'}
                                                        </p>
                                                        <p className="mt-1 break-all text-xs text-[#59606E]">
                                                            {selectedTicket.requesterEmail || 'No email provided'}
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4 border-t border-[#ECEEF2] pt-4 sm:grid-cols-2">
                                                        <div>
                                                            <p className="text-[9px] uppercase tracking-wide text-[#8B919D]">
                                                                Created
                                                            </p>
                                                            <p className="mt-1 text-xs text-[#59606E]">
                                                                {selectedTicket.createdAt
                                                                    ? new Date(selectedTicket.createdAt).toLocaleString()
                                                                    : 'Unavailable'}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[9px] uppercase tracking-wide text-[#8B919D]">
                                                                Last Updated
                                                            </p>
                                                            <p className="mt-1 text-xs text-[#59606E]">
                                                                {selectedTicket.updatedAt
                                                                    ? new Date(selectedTicket.updatedAt).toLocaleString()
                                                                    : 'Unavailable'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {selectedTicket.resolutionNotes && (
                                                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                                            <h3 className="text-xs font-semibold text-emerald-800">
                                                                Resolution Notes
                                                            </h3>
                                                            <p className="mt-2 whitespace-pre-wrap wrap-break-word text-xs leading-5 text-emerald-700">
                                                                {selectedTicket.resolutionNotes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className="flex justify-end border-t border-[#E6E8ED] px-5 py-3">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedTicket(null)}
                                                className="rounded-md bg-[#0757C9] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0646A5]"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </section>
                                </div>
                            )}


                            

                            {/* =================================================
                                FOOTER
                            ================================================== */}
                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">
                                <div
                                    className="
                                        flex
                                        flex-col
                                        gap-3
                                        text-[10px]
                                        text-[#59606E]
                                        sm:flex-row
                                        sm:items-center
                                        sm:justify-between
                                    "
                                >
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
            {showTicketForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-[#E6E8ED] bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-[#E6E8ED] px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-[#171B25]">
                                    Create Support Ticket
                                </h2>
                                <p className="mt-1 text-xs text-[#7A808C]">
                                    Submit a support request to the BizFlow team.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowTicketForm(false)}
                                disabled={submittingTicket}
                                aria-label="Close ticket form"
                                className="rounded-md px-3 py-2 text-sm text-[#59606E] hover:bg-[#F1F3F8]"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleTicketSubmit} className="space-y-4 p-6">
                            {ticketFormError && (
                                <p
                                    role="alert"
                                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                                >
                                    {ticketFormError}
                                </p>
                            )}

                            <div>
                                <label
                                    htmlFor="ticket-subject"
                                    className="mb-1.5 block text-xs font-medium text-[#343A47]"
                                >
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="ticket-subject"
                                    name="subject"
                                    value={ticketForm.subject}
                                    onChange={handleTicketFormChange}
                                    maxLength={150}
                                    required
                                    placeholder="Enter a short ticket subject"
                                    className="h-10 w-full rounded-md border border-[#DDE1E8] px-3 text-sm outline-none focus:border-[#0757C9]"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="ticket-category"
                                        className="mb-1.5 block text-xs font-medium text-[#343A47]"
                                    >
                                        Category
                                    </label>
                                    <select
                                        id="ticket-category"
                                        name="category"
                                        value={ticketForm.category}
                                        onChange={handleTicketFormChange}
                                        required
                                        className="h-10 w-full rounded-md border border-[#DDE1E8] bg-white px-3 text-sm outline-none focus:border-[#0757C9]"
                                    >
                                        <option value="General">General</option>
                                        <option value="Account">Account</option>
                                        <option value="Automation">Automation</option>
                                        <option value="User Management">User Management</option>
                                        <option value="Reports & Analytics">Reports & Analytics</option>
                                        <option value="Technical Issue">Technical Issue</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="ticket-priority"
                                        className="mb-1.5 block text-xs font-medium text-[#343A47]"
                                    >
                                        Priority
                                    </label>
                                    <select
                                        id="ticket-priority"
                                        name="priority"
                                        value={ticketForm.priority}
                                        onChange={handleTicketFormChange}
                                        required
                                        className="h-10 w-full rounded-md border border-[#DDE1E8] bg-white px-3 text-sm outline-none focus:border-[#0757C9]"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="ticket-description"
                                    className="mb-1.5 block text-xs font-medium text-[#343A47]"
                                >
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="ticket-description"
                                    name="description"
                                    value={ticketForm.description}
                                    onChange={handleTicketFormChange}
                                    maxLength={5000}
                                    required
                                    rows={4}
                                    placeholder="Describe the issue or assistance you need..."
                                    className="w-full resize-y rounded-md border border-[#DDE1E8] px-3 py-2 text-sm outline-none focus:border-[#0757C9]"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="ticket-requester-name"
                                        className="mb-1.5 block text-xs font-medium text-[#343A47]"
                                    >
                                        Requester Name
                                    </label>
                                    <input
                                        id="ticket-requester-name"
                                        name="requesterName"
                                        value={ticketForm.requesterName}
                                        onChange={handleTicketFormChange}
                                        className="h-10 w-full rounded-md border border-[#DDE1E8] px-3 text-sm outline-none focus:border-[#0757C9]"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="ticket-requester-email"
                                        className="mb-1.5 block text-xs font-medium text-[#343A47]"
                                    >
                                        Requester Email
                                    </label>
                                    <input
                                        id="ticket-requester-email"
                                        name="requesterEmail"
                                        type="email"
                                        value={ticketForm.requesterEmail}
                                        onChange={handleTicketFormChange}
                                        placeholder="admin@example.com"
                                        className="h-10 w-full rounded-md border border-[#DDE1E8] px-3 text-sm outline-none focus:border-[#0757C9]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-[#E6E8ED] pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowTicketForm(false)}
                                    disabled={submittingTicket}
                                    className="rounded-md border border-[#DDE1E8] px-4 py-2 text-xs font-medium text-[#59606E] hover:bg-[#F8F9FC] disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submittingTicket}
                                    className="rounded-md bg-[#0052CC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0045AD] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}

export default SupportCenter