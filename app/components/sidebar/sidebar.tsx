import { IconBrain, IconScript, IconTableOptions } from '@tabler/icons-react';
import { Box, Element4, Receipt2, SearchNormal1 } from "iconsax-reactjs";
import Image from "next/image";
import SidebarItem from "./sidebar-item";
import UserDetailsCard from "./user-card";

function Sidebar() {
    const sidebarNavItems = [
        {
            label: "Dashboard",
            id: "dashboard",
            url: "/dashboard",
            icon: <Element4 />,
            isParent: false,
            external: false,
            disabled: true,
        },
        {
            label: "Manage Flipbooks",
            id: "flipbooks",
            url: "/flipbooks",
            icon: <Receipt2 />,
            isParent: false,
            external: false,
            disabled: false,
        },
        {
            label: "Profile",
            id: "profile",
            url: "/profile",
            icon: <SearchNormal1 />,
            isParent: false,
            external: false,
            disabled: false,
        }
    ];
    return (
        <div className="relative h-full">
            <div className="px-2 h-full flex flex-col justify-between pb-2">
                <div>
                    <div className="py-6 flex items-center justify-center">
                        <div className="flex flex-row items-center gap-2 w-4/5">
                            <span className="text-xl font-bold">Flipbook</span>
                        </div>
                    </div>
                    <div className="space-y-1 justify-center">
                        {sidebarNavItems.map((item) => (
                            <SidebarItem key={item.id} {...item} />
                        ))}
                    </div>
                </div>
                <UserDetailsCard />
            </div>
        </div>

    );
}

export default Sidebar;
