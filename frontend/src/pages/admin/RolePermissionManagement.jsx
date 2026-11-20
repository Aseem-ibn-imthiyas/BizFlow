import { useEffect, useState } from 'react'
import { auth } from '../../config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import AdminSidebar from '../../components/sidebar/AdminSidebar'
import {
    Bell,
    CircleHelp,
    Search,
    Users,
    Shield,
    UserRound,
    Download,
    Filter,
    PlusCircle,
    Copy,
    Upload,
    FileDown,
    Info,
    Check,
    RotateCcw,
    Grid2X2,
    Workflow,
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function RolePermissionManagement() {

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [savedPermissions, setSavedPermissions] = useState({})


    const [selectedRole, setSelectedRole] = useState('Administrator')
    const [saved, setSaved] = useState(false)

    const isAdministrator = selectedRole === 'Administrator'


    const roles = [
        {
            name: 'Administrator',
            users: 8,
            label: 'FULL ACCESS',
            description: [
                'System-wide config',
                'User & role mgmt',
                'Billing & infrastructure',
            ],
            icon: Shield,
            iconClass: 'bg-[#EAF0FF] text-[#0757C9]',
            badgeClass: 'bg-[#EEF3FF] text-[#315A9E]',
        },
        {
            name: 'Manager',
            users: 24,
            label: 'DEPARTMENTAL',
            description: [
                'Workflow approvals',
                'Team analytics',
                'Inventory oversight',
            ],
            icon: Users,
            iconClass: 'bg-[#EEF0FF] text-[#596AA0]',
            badgeClass: 'bg-[#F1F3FA] text-[#59606E]',
        },
        {
            name: 'Staff',
            users: 142,
            label: 'LIMITED',
            description: [
                'Task execution',
                'Individual reporting',
                'Personal settings',
            ],
            icon: UserRound,
            iconClass: 'bg-[#F0F1F5] text-[#59606E]',
            badgeClass: 'bg-[#F1F3F7] text-[#59606E]',
        },
    ]

    const modules = [
        'Dashboard',
        'User Management',
        'Inventory Management',
        'Sales Management',
        'Task Management',
        'Reports',
        'Analytics',
        'Notifications',
        'Profile',
        'System Settings',
        'Workflow Automation',
        'Audit Logs',
    ]

    const permissionCodes = ['V', 'C', 'E', 'D', 'A', 'X']

    const permissionLabels = {
        V: 'View',
        C: 'Create',
        E: 'Edit',
        D: 'Delete',
        A: 'Approve',
        X: 'Execute',
    }

    const [permissions, setPermissions] = useState(() => {
        const initial = {}

        roles.forEach((role) => {
            initial[role.name] = {}

            modules.forEach((module) => {
                initial[role.name][module] = {
                    V: role.name !== 'Staff' || module !== 'System Settings',
                    C: role.name !== 'Staff',
                    E: role.name !== 'Staff',
                    D: role.name === 'Administrator',
                    A: role.name !== 'Staff',
                    X: role.name !== 'Staff' || module === 'Task Management',
                }
            })
        })

        return initial
    })




    useEffect(() => {
        let cancelled = false
        let unsubscribe

        async function loadPermissions(currentUser) {
            setLoading(true)
            setErrorMessage('')
            setSuccessMessage('')

            try {
                const token = await currentUser.getIdToken()

                const response = await fetch(
                    `${API_BASE_URL}/api/permissions`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )

                const result = await response.json()

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || 'Failed to load permissions.'
                    )
                }

                const permissionsByRole = {}

                for (const item of result.data) {
                    permissionsByRole[item.role] = item.permissions
                }

                if (!cancelled) {
                    setSavedPermissions(permissionsByRole)
                    setPermissions((previous) => ({
                        ...previous,
                        ...permissionsByRole,
                    }))
                }
            } catch (error) {
                if (!cancelled) {
                    setErrorMessage(
                        error.message || 'Unable to load permissions.'
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (cancelled) return

            if (!currentUser) {
                setErrorMessage('Please sign in again to continue.')
                setLoading(false)
                return
            }

            loadPermissions(currentUser)
        })

        return () => {
            cancelled = true
            unsubscribe?.()
        }
    }, [])


    const togglePermission = (module, code) => {
        if (isAdministrator) return

        setSaved(false)
        setSuccessMessage('')

        setPermissions((previous) => ({
            ...previous,
            [selectedRole]: {
                ...previous[selectedRole],
                [module]: {
                    ...previous[selectedRole][module],
                    [code]: !previous[selectedRole][module][code],
                },
            },
        }))
    }

    const handleSave = async () => {
        if (isAdministrator) return
        setSaving(true)
        setSaved(false)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            const currentUser = auth.currentUser

            if (!currentUser) {
                throw new Error('Please sign in again to continue.')
            }

            const token = await currentUser.getIdToken()
            const rolePermissions = permissions[selectedRole]

            const response = await fetch(
                `${API_BASE_URL}/api/permissions/${encodeURIComponent(selectedRole)}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        permissions: rolePermissions,
                    }),
                }
            )

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Failed to save permissions.'
                )
            }

            const updatedPermissions = {
                ...savedPermissions,
                [selectedRole]: result.data.permissions,
            }

            setPermissions((previous) => ({
                ...previous,
                [selectedRole]: result.data.permissions,
            }))

            setSavedPermissions(updatedPermissions)
            setSaved(true)
            setSuccessMessage(result.message || 'Permissions saved successfully.')
        } catch (error) {
            setErrorMessage(error.message || 'Unable to save permissions.')
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        setPermissions((previous) => ({
            ...previous,
            [selectedRole]: savedPermissions[selectedRole],
        }))

        setSaved(false)
        setErrorMessage('')
        setSuccessMessage('')
    }


    

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">

                {/* =====================================================
                    SIDEBAR
                ====================================================== */}
                <AdminSidebar />


                {/* =====================================================
                    RIGHT SIDE
                ====================================================== */}
                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

                    {/* HEADER */}
                    <header
                        className="
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
                                    bg-[#F1F3FA]
                                    pl-10
                                    pr-4
                                    text-xs
                                    outline-none
                                    placeholder:text-[#8B919D]
                                    focus:bg-white
                                "
                            />
                        </div>

                        <div className="flex items-center gap-5">
                            <button
                                type="button"
                                className="text-[#59606E] hover:text-[#0757C9]"
                                aria-label="Notifications"
                            >
                                <Bell size={18} />
                            </button>

                            <button
                                type="button"
                                className="text-[#59606E] hover:text-[#0757C9]"
                                aria-label="Help"
                            >
                                <CircleHelp size={18} />
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

                    {/* =====================================================
                        SCROLLABLE MAIN CONTENT
                    ====================================================== */}
                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                        <div className="px-6 py-6 lg:px-8">

                            {/* PAGE HEADER */}
                            <div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-[#343A47]">
                                        Home
                                    </span>

                                    <span className="text-[#A1A6B0]">
                                        ›
                                    </span>

                                    <span className="font-medium text-[#0757C9]">
                                        Roles & Permissions
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
                                    Role & Permission Management
                                </h2>

                                <p className="mt-1 text-sm text-[#69707D]">
                                    Configure user roles and manage granular access permissions across the system ecosystem.
                                </p>

                                {loading && (
                                    <p className="mt-3 text-sm text-[#59606E]" role="status">
                                        Loading permissions from the server...
                                    </p>
                                )}

                                {errorMessage && (
                                    <p
                                        className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                                        role="alert"
                                    >
                                        {errorMessage}
                                    </p>
                                )}

                                {successMessage && (
                                    <p
                                        className="mt-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                                        role="status"
                                    >
                                        {successMessage}
                                    </p>
                                )}

                            </div>

                            {/* =================================================
                                ROLE CARDS
                            ================================================== */}
                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                                {roles.map((role) => {
                                    const Icon = role.icon
                                    const isSelected =
                                        selectedRole === role.name

                                    return (
                                        <button
                                            key={role.name}
                                            type="button"
                                            onClick={() => {
                                                setSelectedRole(role.name)
                                                setSaved(false)
                                            }}
                                            className={`
                                                relative
                                                rounded-lg
                                                border
                                                bg-white
                                                p-4
                                                text-left
                                                shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                                transition
                                                ${isSelected
                                                    ? 'border-[#C7D5F5] ring-1 ring-[#DDE6FF]'
                                                    : 'border-[#E3E6EC]'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div
                                                    className={`
                                                        flex
                                                        h-9
                                                        w-9
                                                        items-center
                                                        justify-center
                                                        rounded-md
                                                        ${role.iconClass}
                                                    `}
                                                >
                                                    <Icon size={17} />
                                                </div>

                                                <span
                                                    className={`
                                                        rounded-full
                                                        px-2
                                                        py-1
                                                        text-[8px]
                                                        font-semibold
                                                        tracking-wide
                                                        ${role.badgeClass}
                                                    `}
                                                >
                                                    {role.label}
                                                </span>
                                            </div>

                                            <h3 className="mt-3 text-sm font-bold text-[#242936]">
                                                {role.name}
                                            </h3>

                                            <ul className="mt-2 space-y-1">
                                                {role.description.map((item) => (
                                                    <li
                                                        key={item}
                                                        className="text-[10px] text-[#59606E]"
                                                    >
                                                        • {item}
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="mt-5 flex items-center justify-between border-t border-[#EEF0F4] pt-3">
                                                <span className="text-[10px] font-medium text-[#343A47]">
                                                    {role.users} Users
                                                </span>

                                                <span className="text-[10px] font-semibold text-[#0757C9]">
                                                    Edit Permissions
                                                </span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* =================================================
                                MATRIX + SIDE PANEL
                            ================================================== */}
                            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">

                                {/* MATRIX */}
                                <section
                                    className="
                                        min-w-0
                                        overflow-hidden
                                        rounded-lg
                                        border
                                        border-[#E3E6EC]
                                        bg-white
                                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    "
                                >

                                    {isAdministrator && (
                                        <div
                                            role="status"
                                            className="m-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"
                                        >
                                            <strong>Full Access:</strong> Administrators have full system
                                            access. Their permissions cannot be restricted here.
                                        </div>
                                    )}

                                    {/* Matrix Toolbar */}
                                    <div className="flex flex-col gap-3 border-b border-[#ECEEF2] bg-[#F8F8FF] p-3 md:flex-row md:items-center md:justify-between">

                                        <div className="flex flex-1 items-center gap-2">
                                            <div className="relative max-w-xs flex-1">
                                                <Search
                                                    size={14}
                                                    className="
                                                        absolute
                                                        left-3
                                                        top-1/2
                                                        -translate-y-1/2
                                                        text-[#89909D]
                                                    "
                                                />

                                                <input
                                                    type="text"
                                                    placeholder="Search modules or roles..."
                                                    className="
                                                        h-9
                                                        w-full
                                                        rounded-md
                                                        border
                                                        border-[#D9DDE7]
                                                        bg-white
                                                        pl-9
                                                        pr-3
                                                        text-xs
                                                        outline-none
                                                    "
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                className="
                                                    flex
                                                    h-9
                                                    items-center
                                                    gap-2
                                                    rounded-md
                                                    border
                                                    border-[#D9DDE7]
                                                    bg-white
                                                    px-3
                                                    text-xs
                                                    text-[#454B58]
                                                "
                                            >
                                                <Filter size={13} />
                                                All Modules
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            className="
                                                flex
                                                items-center
                                                justify-center
                                                gap-2
                                                text-xs
                                                font-medium
                                                text-[#59606E]
                                            "
                                        >
                                            <Download size={13} />
                                            Export Matrix
                                        </button>
                                    </div>

                                    {/* Matrix Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-190 border-collapse">
                                            <thead>
                                                <tr className="bg-[#EEEFFA]">
                                                    <th className="w-57.5 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[#59606E]">
                                                        Module Name
                                                    </th>

                                                    {roles.map((role) => (
                                                        <th
                                                            key={role.name}
                                                            className="
                                                                px-3
                                                                py-3
                                                                text-center
                                                                text-[10px]
                                                                font-bold
                                                                uppercase
                                                                tracking-wide
                                                                text-[#59606E]
                                                            "
                                                        >
                                                            {role.name}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {modules.map((module) => (
                                                    <tr
                                                        key={module}
                                                        className="
                                                            border-t
                                                            border-[#EEF0F4]
                                                            hover:bg-[#FBFCFF]
                                                        "
                                                    >
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                {module ===
                                                                    'Workflow Automation' ? (
                                                                    <Workflow
                                                                        size={13}
                                                                        className="text-[#4D70B8]"
                                                                    />
                                                                ) : (
                                                                    <Grid2X2
                                                                        size={13}
                                                                        className="text-[#4D70B8]"
                                                                    />
                                                                )}

                                                                <span className="text-[10px] font-medium text-[#343A47]">
                                                                    {module}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {roles.map((role) => (
                                                            <td
                                                                key={`${module}-${role.name}`}
                                                                className="px-3 py-3"
                                                            >
                                                                <div className="flex items-center justify-center gap-1">
                                                                    {permissionCodes.map(
                                                                        (
                                                                            code,
                                                                        ) => {
                                                                            const active =
                                                                                permissions[
                                                                                role.name
                                                                                ][
                                                                                module
                                                                                ][
                                                                                code
                                                                                ]

                                                                            const selected =
                                                                                role.name ===
                                                                                selectedRole

                                                                            return (
                                                                                <button
                                                                                    key={
                                                                                        code
                                                                                    }
                                                                                    type="button"

                                                                                    disabled={isAdministrator || loading || saving}
                                                                                    title={isAdministrator ? 'Administrators always have full access' : `Toggle ${permissionLabels[code]} permission`
                                                                                    }

                                                                                    onClick={() =>
                                                                                        togglePermission(
                                                                                            module,
                                                                                            code,
                                                                                        )
                                                                                    }
                                                                                    className={`
                                                                                        flex
                                                                                        h-5
                                                                                        w-5
                                                                                        items-center
                                                                                        justify-center
                                                                                        rounded-[3px]
                                                                                        text-[7px]
                                                                                        font-bold
                                                                                        transition
                                                                                        ${active
                                                                                            ? selected
                                                                                                ? 'bg-[#0757C9] text-white'
                                                                                                : 'bg-[#566B9D] text-white'
                                                                                            : 'bg-[#ECEEF4] text-[#B5BAC5]'
                                                                                        }
                                                                                    `}
                                                                                >
                                                                                    {code}
                                                                                </button>
                                                                            )
                                                                        },
                                                                    )}
                                                                </div>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                {/* RIGHT PANEL */}
                                <aside className="space-y-4">

                                    {/* Active Context */}
                                    <section
                                        className="
                                            overflow-hidden
                                            rounded-lg
                                            border
                                            border-[#E3E6EC]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >
                                        <div className="h-1 bg-[#0757C9]" />

                                        <div className="p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A909B]">
                                                Active Context
                                            </p>

                                            <div className="mt-4 flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF3FF] text-[#0757C9]">
                                                    <Shield size={17} />
                                                </div>

                                                <div>
                                                    <p className="text-xs font-bold text-[#343A47]">
                                                        {selectedRole}
                                                    </p>

                                                    <span className="mt-1 inline-block rounded-full bg-[#E8F8EF] px-2 py-0.5 text-[7px] font-semibold text-[#168C4B]">
                                                        Default Role
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="mt-4 text-[10px] leading-4 text-[#69707D]">
                                                {selectedRole ===
                                                    'Administrator'
                                                    ? 'Highest privilege tier. This role is allowed to perform all actions across all system modules without restriction.'
                                                    : selectedRole ===
                                                        'Manager'
                                                        ? 'Department-level access focused on workflow approvals, team analytics, inventory oversight, and operational management.'
                                                        : 'Limited access for daily task execution, individual reporting, and personal account settings.'}
                                            </p>

                                            <div className="mt-5 space-y-3 border-t border-[#ECEEF2] pt-4">
                                                <ContextRow
                                                    label="Created On"
                                                    value="Jan 12, 2023"
                                                />

                                                <ContextRow
                                                    label="Last Modified"
                                                    value="3 days ago"
                                                />

                                                <ContextRow
                                                    label="Access Type"
                                                    value={
                                                        selectedRole ===
                                                            'Administrator'
                                                            ? 'Unrestricted'
                                                            : selectedRole ===
                                                                'Manager'
                                                                ? 'Departmental'
                                                                : 'Limited'
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Quick Actions */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E3E6EC]
                                            bg-white
                                            p-4
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A0A6B2]">
                                            Quick Actions
                                        </p>

                                        <div className="mt-3 space-y-1">
                                            <QuickAction
                                                icon={<PlusCircle size={14} />}
                                                label="Create New Role"
                                            />

                                            <QuickAction
                                                icon={<Copy size={14} />}
                                                label="Duplicate Role"
                                            />

                                            <QuickAction
                                                icon={<Upload size={14} />}
                                                label="Import Permissions"
                                            />

                                            <QuickAction
                                                icon={<FileDown size={14} />}
                                                label="Export Permissions"
                                            />
                                        </div>
                                    </section>

                                    {/* Guidelines */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#F4B59E]
                                            bg-[#FFE1D5]
                                            p-4
                                        "
                                    >
                                        <div className="flex items-center gap-2">
                                            <Info
                                                size={14}
                                                className="text-[#C65D2F]"
                                            />

                                            <p className="text-xs font-semibold text-[#9E4827]">
                                                Permission Guidelines
                                            </p>
                                        </div>

                                        <p className="mt-2 text-[9px] leading-4 text-[#9E4827]">
                                            Changes to permissions take effect
                                            immediately. Active sessions for
                                            impacted users will be refreshed upon
                                            their next interaction with the
                                            system. Always verify audit logs
                                            after bulk updates.
                                        </p>
                                    </section>
                                </aside>
                            </div>

                            {/* =================================================
                                SAVE BAR
                            ================================================== */}
                            <div
                                className="
                                    sticky
                                    bottom-0
                                    z-10
                                    mt-7
                                    flex
                                    flex-col
                                    gap-4
                                    border-t
                                    border-[#E1E4EA]
                                    bg-white/95
                                    px-4
                                    py-4
                                    backdrop-blur
                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-between
                                "
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`
                                            h-2
                                            w-2
                                            rounded-full
                                            ${saved
                                                ? 'bg-[#18A957]'
                                                : 'bg-[#18A957]'
                                            }
                                        `}
                                    />

                                    <span className="text-[10px] text-[#59606E]">
                                        {saved
                                            ? 'All changes saved'
                                            : 'All changes synced'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-end gap-5">
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="
                                            flex
                                            items-center
                                            gap-2
                                            text-[10px]
                                            font-semibold
                                            text-[#59606E]
                                            hover:text-[#0757C9]
                                        "
                                    >
                                        <RotateCcw size={12} />
                                        Reset Changes
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="
                                            text-[10px]
                                            font-semibold
                                            text-[#59606E]
                                            hover:text-[#0757C9]
                                        "
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={isAdministrator || loading || saving}
                                        onClick={handleSave}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            bg-[#0757C9]
                                            px-5
                                            text-xs
                                            font-semibold
                                            text-white
                                            shadow-sm
                                            hover:bg-[#0045AD]
                                        "
                                    >
                                        <Check size={14} />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>

                            {/* FOOTER */}
                            <footer className="border-t border-[#E1E4EA] py-5">
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
   SMALL COMPONENTS
========================================================= */

function ContextRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-[9px] text-[#69707D]">
                {label}
            </span>

            <span className="text-[9px] font-medium text-[#343A47]">
                {value}
            </span>
        </div>
    )
}

function QuickAction({ icon, label }) {
    return (
        <button
            type="button"
            className="
                flex
                h-9
                w-full
                items-center
                gap-3
                rounded-md
                px-2
                text-left
                text-[10px]
                font-medium
                text-[#454B58]
                hover:bg-[#F5F7FC]
            "
        >
            <span className="text-[#0757C9]">
                {icon}
            </span>

            {label}
        </button>
    )
}

export default RolePermissionManagement