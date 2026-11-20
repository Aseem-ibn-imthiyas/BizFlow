import AdminSidebar from '../../components/sidebar/AdminSidebar'
import {
    Bell,
    CircleHelp,
    Search,
    LayoutDashboard,
    Users,
    History,
    Settings,
    UserRound,
    BriefcaseBusiness,
    Shield,
    Pencil,
    KeyRound,
    LockKeyhole,
    Trash2,
    CheckCircle2,
    Copy,
    Download,
    Monitor,
    LogIn,
    UserCog,
    UserPlus,
    MoreHorizontal,
    Info,
} from 'lucide-react'

function UserDetails() {

    const permissions = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
        },
        {
            label: 'User Management',
            icon: Users,
        },
        {
            label: 'Inventory',
            icon: BriefcaseBusiness,
        },
        {
            label: 'Sales',
            icon: Shield,
        },
        {
            label: 'Tasks',
            icon: CheckCircle2,
        },
        {
            label: 'Reports',
            icon: History,
        },
        {
            label: 'Notifications',
            icon: Bell,
        },
        {
            label: 'System Settings',
            icon: Settings,
        },
    ]

    const activities = [
        {
            title: 'Logged In',
            description: 'Successful login from Seattle office',
            date: 'TODAY, 10:45 AM',
            icon: LogIn,
            className: 'bg-[#0757C9] text-white',
        },
        {
            title: 'Password Changed',
            description: 'Security update performed via dashboard',
            date: 'OCT 20, 04:30 PM',
            icon: MoreHorizontal,
            className: 'bg-[#E8EAF2] text-[#59606E]',
        },
        {
            title: 'Profile Updated',
            description: 'Updated contact phone number',
            date: 'OCT 15, 11:20 AM',
            icon: UserCog,
            className: 'bg-[#E8EAF2] text-[#59606E]',
        },
        {
            title: 'User Created',
            description: 'Account provisioned by Admin',
            date: 'JAN 15, 2023',
            icon: UserPlus,
            className: 'bg-[#18A957] text-white',
        },
    ]

    const loginHistory = [
        {
            date: 'Oct 24, 2024',
            time: '10:45 AM',
            device: 'Chrome / Windows',
            ip: '192.168.1.45',
            location: 'Seattle, WA',
        },
        {
            date: 'Oct 24, 2024',
            time: '10:45 AM',
            device: 'Safari / iOS',
            ip: '172.24.9.112',
            location: 'Seattle, WA',
        },
        {
            date: 'Oct 24, 2024',
            time: '10:45 AM',
            device: 'Chrome / Windows',
            ip: '192.168.1.45',
            location: 'Seattle, WA',
        },
    ]

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
                                className="
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
                            >
                                <Bell size={18} />
                            </button>

                            <button
                                type="button"
                                className="text-[#59606E] hover:text-[#0757C9]"
                            >
                                <CircleHelp size={18} />
                            </button>

                            <div className="h-7 w-px bg-[#E1E4EA]" />

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-[#242936]">
                                        Admin User
                                    </p>

                                    <p className="text-[9px] tracking-wide text-[#737A87]">
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
                        SCROLLABLE MAIN
                    ====================================================== */}
                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">

                        <div className="px-6 py-7 lg:px-8">

                            {/* PAGE HEADER */}
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

                                <div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-[#343A47]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            ›
                                        </span>

                                        <span className="text-[#343A47]">
                                            User Management
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            ›
                                        </span>

                                        <span className="font-medium text-[#0757C9]">
                                            User Details
                                        </span>
                                    </div>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#171B25]">
                                        User Details
                                    </h2>

                                    <p className="mt-1 text-sm text-[#69707D]">
                                        View complete user account information and activity.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        className="
                                            flex
                                            h-10
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#D7DBE4]
                                            bg-white
                                            px-4
                                            text-xs
                                            font-medium
                                            text-[#343A47]
                                            hover:bg-[#F8FAFC]
                                        "
                                    >
                                        ← Back to User Management
                                    </button>

                                    <button
                                        type="button"
                                        className="
                                            flex
                                            h-10
                                            items-center
                                            gap-2
                                            rounded-md
                                            bg-[#0757C9]
                                            px-5
                                            text-xs
                                            font-semibold
                                            text-white
                                            hover:bg-[#0045AD]
                                        "
                                    >
                                        <Pencil size={14} />
                                        Edit User
                                    </button>
                                </div>
                            </div>

                            {/* =====================================================
                                USER SUMMARY
                            ====================================================== */}
                            <section
                                className="
                                    mt-7
                                    rounded-lg
                                    border
                                    border-[#E3E6EC]
                                    bg-white
                                    p-6
                                    shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                "
                            >
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[120px_repeat(4,minmax(0,1fr))] lg:items-center">

                                    {/* Avatar */}
                                    <div className="flex justify-center lg:justify-start">
                                        <div className="relative">
                                            <div
                                                className="
                                                    flex
                                                    h-20
                                                    w-20
                                                    items-center
                                                    justify-center
                                                    overflow-hidden
                                                    rounded-full
                                                    border-4
                                                    border-[#EEF1F7]
                                                    bg-[#E5EAF2]
                                                    shadow-sm
                                                "
                                            >
                                                <UserRound
                                                    size={38}
                                                    className="text-[#718096]"
                                                />
                                            </div>

                                            <span
                                                className="
                                                    absolute
                                                    bottom-0
                                                    right-0
                                                    h-3
                                                    w-3
                                                    rounded-full
                                                    border-2
                                                    border-white
                                                    bg-[#18A957]
                                                "
                                            />
                                        </div>
                                    </div>

                                    {/* User */}
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-bold text-[#242936]">
                                                Alex Rivera
                                            </h3>

                                            <span className="rounded-full bg-[#EEF3FF] px-2.5 py-1 text-[8px] font-semibold text-[#315A9E]">
                                                ADMINISTRATOR
                                            </span>

                                            <span className="rounded-full bg-[#E8F8EF] px-2.5 py-1 text-[8px] font-semibold text-[#168C4B]">
                                                ACTIVE
                                            </span>
                                        </div>
                                    </div>

                                    {/* Employee */}
                                    <div>
                                        <p className="text-[9px] font-medium uppercase tracking-wide text-[#8A909B]">
                                            Employee ID
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                            #USR-8421
                                        </p>
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <p className="text-[9px] font-medium uppercase tracking-wide text-[#8A909B]">
                                            Department
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                            Engineering
                                        </p>
                                    </div>

                                    {/* Email / Login */}
                                    <div className="grid grid-cols-2 gap-6 lg:col-span-2">
                                        <div>
                                            <p className="text-[9px] font-medium uppercase tracking-wide text-[#8A909B]">
                                                Email Address
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                                alex.rivera@bizflow.ai
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-medium uppercase tracking-wide text-[#8A909B]">
                                                Last Login
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                                2 hours ago
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* =====================================================
                                MAIN GRID
                            ====================================================== */}
                            <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">

                                {/* =================================================
                                    LEFT COLUMN
                                ================================================== */}
                                <div className="space-y-5">

                                    {/* PERSONAL INFORMATION */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E3E6EC]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >
                                        <div className="flex items-center justify-between border-b border-[#ECEEF2] px-5 py-4">
                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Personal Information
                                            </h3>

                                            <Info
                                                size={16}
                                                className="text-[#69707D]"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">

                                            <DetailField
                                                label="Full Name"
                                                value="Alex Rivera"
                                            />

                                            <DetailField
                                                label="Username"
                                                value="arivera_admin"
                                            />

                                            <DetailField
                                                label="Email"
                                                value="alex.rivera@bizflow.ai"
                                            />

                                            <DetailField
                                                label="Phone"
                                                value="+1 (555) 012-3456"
                                            />

                                            <DetailField
                                                label="Gender"
                                                value="Male"
                                            />

                                            <DetailField
                                                label="Date of Birth"
                                                value="May 12, 1988"
                                            />

                                            <div className="md:col-span-2">
                                                <DetailField
                                                    label="Address"
                                                    value="742 Evergreen Terrace, Suite 101, Springfield, WA 98001"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* ACCOUNT INFORMATION */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E3E6EC]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >
                                        <div className="border-b border-[#ECEEF2] px-5 py-4">
                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Account Information
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">

                                            <InfoCard
                                                label="User ID"
                                                value="KNC-842-110"
                                                icon={<Copy size={15} />}
                                            />

                                            <InfoCard
                                                label="Account Status"
                                                value="Active"
                                                icon={
                                                    <CheckCircle2
                                                        size={15}
                                                    />
                                                }
                                                valueClass="text-[#18A957]"
                                            />

                                            <InfoCard
                                                label="Email Verification"
                                                value="Verified"
                                                icon={
                                                    <CheckCircle2
                                                        size={15}
                                                    />
                                                }
                                                valueClass="text-[#343A47]"
                                            />

                                            <InfoCard
                                                label="Password Status"
                                                value="Secure (Last changed 45 days ago)"
                                                icon={
                                                    <LockKeyhole size={15} />
                                                }
                                            />

                                            <div>
                                                <p className="text-[10px] text-[#69707D]">
                                                    Created Date
                                                </p>

                                                <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                                    January 15, 2023 | 09:30 AM
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-[#69707D]">
                                                    Last Updated
                                                </p>

                                                <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                                    March 10, 2024 | 02:15 PM
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* LOGIN HISTORY */}
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
                                        <div className="flex items-center justify-between border-b border-[#ECEEF2] px-5 py-4">
                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Login History
                                            </h3>

                                            <button
                                                type="button"
                                                className="
                                                    flex
                                                    items-center
                                                    gap-2
                                                    text-xs
                                                    font-medium
                                                    text-[#0757C9]
                                                "
                                            >
                                                <Download size={14} />
                                                Download CSV
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-175 border-collapse">
                                                <thead>
                                                    <tr className="bg-[#F1F1FC]">
                                                        <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#59606E]">
                                                            Date & Time
                                                        </th>

                                                        <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#59606E]">
                                                            Device / Browser
                                                        </th>

                                                        <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#59606E]">
                                                            IP Address
                                                        </th>

                                                        <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#59606E]">
                                                            Location
                                                        </th>

                                                        <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#59606E]">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {loginHistory.map((login) => (
                                                        <tr
                                                            key={`${login.date}-${login.device}`}
                                                            className="border-t border-[#ECEEF2]"
                                                        >
                                                            <td className="px-5 py-6">
                                                                <p className="text-xs font-semibold text-[#343A47]">
                                                                    {login.date}
                                                                </p>

                                                                <p className="mt-1 text-[9px] text-[#69707D]">
                                                                    {login.time}
                                                                </p>
                                                            </td>

                                                            <td className="px-5 py-6">
                                                                <div className="flex items-center gap-2 text-xs text-[#343A47]">
                                                                    <Monitor size={14} />
                                                                    {login.device}
                                                                </div>
                                                            </td>

                                                            <td className="px-5 py-6 text-xs text-[#7A808C]">
                                                                {login.ip}
                                                            </td>

                                                            <td className="px-5 py-6 text-xs text-[#343A47]">
                                                                {login.location}
                                                            </td>

                                                            <td className="px-5 py-6">
                                                                <span className="rounded bg-[#E8F8EF] px-2 py-1 text-[8px] font-semibold text-[#168C4B]">
                                                                    SUCCESSFUL
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                </div>

                                {/* =================================================
                                    RIGHT COLUMN
                                ================================================== */}
                                <aside className="space-y-5">

                                    {/* Quick Actions */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E3E6EC]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Quick Actions
                                        </h3>

                                        <div className="mt-4 space-y-2">
                                            <ActionButton
                                                icon={<Pencil size={15} />}
                                                label="Edit User Details"
                                            />

                                            <ActionButton
                                                icon={<KeyRound size={15} />}
                                                label="Reset User Password"
                                                iconClass="text-orange-500"
                                            />

                                            <ActionButton
                                                icon={<LockKeyhole size={15} />}
                                                label="Lock User Account"
                                                iconClass="text-orange-500"
                                            />

                                            <ActionButton
                                                icon={<Trash2 size={15} />}
                                                label="Delete User Permanently"
                                                danger
                                            />
                                        </div>
                                    </section>

                                    {/* Assigned Permissions */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E3E6EC]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Assigned Permissions
                                        </h3>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {permissions.map((permission) => {
                                                const Icon = permission.icon

                                                return (
                                                    <span
                                                        key={permission.label}
                                                        className="
                                                            inline-flex
                                                            items-center
                                                            gap-1.5
                                                            rounded
                                                            bg-[#EEF0FA]
                                                            px-2.5
                                                            py-1.5
                                                            text-[10px]
                                                            font-medium
                                                            text-[#59606E]
                                                        "
                                                    >
                                                        <Icon size={11} />
                                                        {permission.label}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </section>

                                    {/* Recent Activity */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E3E6EC]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Recent Activity
                                        </h3>

                                        <div className="relative mt-5 space-y-5">
                                            <div
                                                className="
                                                    absolute
                                                    left-3
                                                    top-3
                                                    h-[calc(100%-20px)]
                                                    w-px
                                                    bg-[#DCE0E8]
                                                "
                                            />

                                            {activities.map((activity) => {
                                                const Icon = activity.icon

                                                return (
                                                    <div
                                                        key={activity.title}
                                                        className="relative flex gap-3"
                                                    >
                                                        <div
                                                            className={`
                                                                relative
                                                                z-10
                                                                flex
                                                                h-7
                                                                w-7
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-full
                                                                ${activity.className}
                                                            `}
                                                        >
                                                            <Icon size={13} />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-[#343A47]">
                                                                {activity.title}
                                                            </p>

                                                            <p className="mt-0.5 text-[10px] leading-4 text-[#69707D]">
                                                                {activity.description}
                                                            </p>

                                                            <p className="mt-1 text-[8px] font-semibold tracking-wide text-[#8A909B]">
                                                                {activity.date}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <button
                                            type="button"
                                            className="
                                                mt-6
                                                w-full
                                                text-center
                                                text-xs
                                                font-medium
                                                text-[#0757C9]
                                            "
                                        >
                                            View All Activity
                                        </button>
                                    </section>
                                </aside>
                            </div>

                            {/* Footer */}
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
   REUSABLE SMALL COMPONENTS
========================================================= */

function DetailField({ label, value }) {
    return (
        <div>
            <p className="mb-2 text-[10px] font-medium text-[#69707D]">
                {label}
            </p>

            <div
                className="
                    flex
                    min-h-10
                    items-center
                    rounded-md
                    border
                    border-[#E2E6ED]
                    bg-[#F8FAFC]
                    px-3
                    py-2
                    text-xs
                    font-medium
                    text-[#343A47]
                "
            >
                {value}
            </div>
        </div>
    )
}

function InfoCard({
    label,
    value,
    icon,
    valueClass = 'text-[#343A47]',
}) {
    return (
        <div
            className="
                rounded-md
                bg-[#F8F7FD]
                p-4
            "
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] text-[#69707D]">
                        {label}
                    </p>

                    <p
                        className={`
                            mt-1
                            text-xs
                            font-semibold
                            ${valueClass}
                        `}
                    >
                        {value}
                    </p>
                </div>

                <span className="text-[#0757C9]">
                    {icon}
                </span>
            </div>
        </div>
    )
}

function ActionButton({
    icon,
    label,
    danger = false,
    iconClass = 'text-[#0757C9]',
}) {
    return (
        <button
            type="button"
            className={`
                flex
                h-10
                w-full
                items-center
                gap-3
                rounded-md
                border
                px-3
                text-left
                text-xs
                font-medium
                transition
                ${danger
                    ? 'border-red-100 bg-red-50/50 text-[#4B5260] hover:bg-red-50'
                    : 'border-[#E9E6F2] bg-[#FAF9FF] text-[#454B58] hover:bg-[#F4F6FC]'
                }
            `}
        >
            <span className={danger ? 'text-red-500' : iconClass}>
                {icon}
            </span>

            {label}
        </button>
    )
}

export default UserDetails