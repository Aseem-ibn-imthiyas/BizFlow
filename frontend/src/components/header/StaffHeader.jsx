
import { useNavigate } from 'react-router-dom'

import {
    Search,
    Bell,
    Settings,
} from 'lucide-react'

function AppHeader({
    searchPlaceholder = 'Search users, reports, settings...',
    onSearch,
}) {
    const navigate = useNavigate()

    return (
        <header
            className="
                sticky
                top-0
                z-30
                flex
                h-16
                shrink-0
                items-center
                justify-between
                border-b
                border-[#E1E4EA]
                bg-white
                px-5
                lg:px-7
            "
        >
            {/* Search */}
            <div className="relative w-64 lg:w-72">

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
                    placeholder={searchPlaceholder}
                    onChange={onSearch}
                    className="
                        h-8
                        w-full
                        rounded-md
                        border
                        border-transparent
                        bg-[#F1F3FA]
                        pl-9
                        pr-3
                        text-[11px]
                        text-[#343A47]
                        outline-none
                        transition
                        placeholder:text-[#8B919D]
                        focus:border-[#D4DCF0]
                        focus:bg-white
                    "
                />

            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-4 lg:gap-5">

                {/* Notifications */}
                <button
                    type="button"
                    aria-label="Notifications"
                    onClick={() => navigate('/staff/notifications')}
                    className="
                        text-[#59606E]
                        transition
                        hover:text-[#0757C9]
                    "
                >
                    <Bell
                        size={17}
                        strokeWidth={1.7}
                    />
                </button>

                {/* Settings */}
                <button
                    type="button"
                    aria-label="Settings"
                    onClick={() => navigate('/staff/settings')}
                    className="
                        text-[#59606E]
                        transition
                        hover:text-[#0757C9]
                    "
                >
                    <Settings
                        size={17}
                        strokeWidth={1.7}
                    />
                </button>

            </div>
        </header>
    )
}

export default AppHeader
