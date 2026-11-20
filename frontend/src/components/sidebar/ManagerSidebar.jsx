import { useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../config/firebase'

import {
    LayoutDashboard,
    Package,
    WalletCards,
    ClipboardList,
    BarChart3,
    BellRing,
    Workflow,
    Settings,
    Plus,
    LogOut,
} from 'lucide-react'

const sidebarItems = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/manager/dashboard',
    },
    {
        label: 'Inventory Management',
        icon: Package,
        path: '/manager/inventory',
    },
    {
        label: 'Sales Management',
        icon: WalletCards,
        path: '/manager/sales',
    },
    {
        label: 'Task Management',
        icon: ClipboardList,
        path: '/manager/tasks',
    },
    {
        label: 'Workflow Automation',
        icon: Workflow,
        path: '/manager/workflows',
    },
    {
        label: 'Reports & Analytics',
        icon: BarChart3,
        path: '/manager/reports',
    },
    {
        label: 'Notifications',
        icon: BellRing,
        path: '/manager/notifications',
    },

]

function ManagerSidebar() {
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await signOut(auth)

            navigate('/manager/login', {
                replace: true,
            })
        } catch (error) {
            console.error('Logout failed:', error)

            alert('Unable to log out. Please try again.')
        }
    }

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
                    Enterprise Manager
                </p>
            </div>

            {/* Navigation */}
            <nav className="px-3 pt-7">
                <div className="space-y-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon

                        const isActive =
                            location.pathname === item.path ||
                            location.pathname.startsWith(`${item.path}/`)

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

                {/* Create Automation */}
                <button
                    type="button"
                    onClick={() => navigate('/manager/automation')}
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

                    Create Automation
                </button>

                {/* Bottom links */}
                <div className="mt-5 space-y-1">

                    <button
                        type="button"
                        onClick={() => navigate('/manager/settings')}
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

export default ManagerSidebar