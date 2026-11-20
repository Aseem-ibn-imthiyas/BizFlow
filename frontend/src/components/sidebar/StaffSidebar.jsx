import { useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../config/firebase'

import {
    LayoutDashboard,
    Package,
    WalletCards,
    ClipboardList,
    BellRing,
    Settings,
    LogOut,
} from 'lucide-react'

const sidebarItems = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/staff/Dashboard',
    },
    {
        label: 'Inventory',
        icon: Package,
        path: '/staff/inventory',
    },
    {
        label: 'Sales',
        icon: WalletCards,
        path: '/staff/sales',
    },
    {
        label: 'Task',
        icon: ClipboardList,
        path: '/staff/tasks',
    },
    {
        label: 'Notifications',
        icon: BellRing,
        path: '/staff/notifications',
    },
]

function StaffSidebar() {
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await signOut(auth)
            navigate('/staff/login', { replace: true })
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
                    Enterprise Staff
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

                {/* Bottom links */}
                <div className="mt-5 space-y-1">

                    {/* Settings */}
                    <button
                        type="button"
                        onClick={() => navigate('/staff/settings')}
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

                    {/* Logout */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="
                        flex
                        h-9
                        w-full
                        items-center
                        gap-3
                        rounded-md
                        px-3
                        text-sm
                        font-medium
                        text-red-600
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

export default StaffSidebar