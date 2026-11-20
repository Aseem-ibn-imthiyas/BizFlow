import { signOut } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { useLocation, useNavigate } from 'react-router-dom'

import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    History,
    HeartPulse,
    Settings,
    LifeBuoy,
    Plus,
    Workflow,
    LogOut,
} from 'lucide-react'

const sidebarItems = [
    {
        label: 'System Overview',
        icon: LayoutDashboard,
        path: '/admin/dashboard',
    },
    {
        label: 'User Management',
        icon: Users,
        path: '/admin/users',
    },
    {
        label: 'Roles & Permissions',
        icon: ShieldCheck,
        path: '/admin/roles',
    },
    {
        label: 'Automation Logs',
        icon: History,
        path: '/admin/logs',
    },
    {
        label: 'System Health',
        icon: HeartPulse,
        path: '/admin/health',
    },
    {
        label: 'Workflow Management',
        icon: Workflow,
        path: '/admin/workflows',
    },
]

function AdminSidebar() {

    const handleLogout = async () => {
        try {
            await signOut(auth)

            navigate('/admin/login', {
                replace: true,
            })
        } catch (error) {
            console.error('Logout failed:', error)

            alert('Unable to log out. Please try again.')
        }
    }
    
    const location = useLocation()
    const navigate = useNavigate()

    return (
        <aside
            className="
                flex
                h-screen
                w-60
                shrink-0
                flex-col
                overflow-hidden
                border-r
                border-[#E1E4EA]
                bg-[#F8F7FF]
                lg:w-64
            "
        >
            {/* Brand */}
            <div
                className="
                    flex
                    h-16
                    shrink-0
                    flex-col
                    justify-center
                    border-b
                    border-[#E1E4EA]
                    px-6
                "
            >
                <h1 className="text-base font-bold tracking-tight text-[#171B25]">
                    BIZFLOW
                </h1>

                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.06em] text-[#656B78]">
                    Enterprise Admin
                </p>
            </div>

            {/* Navigation */}
            <nav className="px-3 pt-7">
                <div className="space-y-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon

                        const isActive =
                            location.pathname === item.path

                        return (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => navigate(item.path)}
                                className={`
                                    flex
                                    h-10
                                    w-full
                                    items-center
                                    gap-3
                                    rounded-md
                                    px-3
                                    text-left
                                    text-sm
                                    font-medium
                                    transition
                                    ${isActive
                                        ? 'bg-[#E4EBFF] text-[#0757C9]'
                                        : 'text-[#343A47] hover:bg-white'
                                    }
                                `}
                            >
                                <Icon
                                    size={17}
                                    strokeWidth={1.8}
                                />

                                {item.label}
                            </button>
                        )
                    })}
                </div>
            </nav>

            {/* Bottom actions */}
            <div className="mt-auto px-3 pb-5">

                <button
                    type="button"
                    onClick={() => navigate('/admin/workflow/')}
                    className="
                    flex
                    h-10
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-md
                    bg-[#0052CC]
                    text-xs
                    font-medium
                    text-white
                    shadow-sm
                    transition
                    hover:bg-[#0045AD]
                "
                >
                    <Plus
                        size={14}
                        strokeWidth={2.3}
                    />

                    Create New Workflow
                </button>

                <div className="mt-5 space-y-1">

                    <button
                        type="button"
                        onClick={() => navigate('/admin/settings')}
                        className="
                        flex
                        h-9
                        w-full
                        items-center
                        gap-3
                        rounded-md
                        px-3
                        text-sm
                        text-[#454B58]
                        transition
                        hover:bg-white
                    "
                    >
                        <Settings
                            size={16}
                            strokeWidth={1.8}
                        />

                        Settings
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/admin/support')}
                        className="
                            flex
                            h-9
                            w-full
                            items-center
                            gap-3
                            rounded-md
                            px-3
                            text-sm
                            text-[#454B58]
                            transition
                            hover:bg-white
                        "
                    >
                        <LifeBuoy
                            size={16}
                            strokeWidth={1.8}
                        />

                        Support
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="
                        mt-1
                        flex
                        h-9
                        w-full
                        items-center
                        gap-3
                        rounded-md
                        px-3
                        text-sm
                        font-medium
                        text-[#DC2626]
                        transition
                        hover:bg-red-50
                    "
                    >
                        <LogOut
                            size={16}
                            strokeWidth={1.8}
                        />

                        Logout
                    </button>

                </div>
            </div>
        </aside>
    )
}

export default AdminSidebar