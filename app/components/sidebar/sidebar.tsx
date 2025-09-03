import {
    Sidebar,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarHeader,
    SidebarSeparator,
    useSidebar
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Element4, ProfileCircle, Book1, Book } from "iconsax-reactjs";
import UserDetailsCard from "./user-card";
import { SidebarArrowToggle } from "./sidebar-arrow-toggle";

const sidebarNavItems = [
    {
        label: "Dashboard",
        id: "dashboard",
        url: "/dashboard",
        icon: <Element4 size={20} />,
        isParent: false,
        external: false,
        disabled: false,
    },
    {
        label: "Manage Flipbooks",
        id: "manage-flipbooks",
        url: "/manage-flipbooks",
        icon: <Book1 size={20} />,
        isParent: false,
        external: false,
        disabled: false,
    },
    {
        label: "Profile",
        id: "profile",
        url: "/profile",
        icon: <ProfileCircle size={20} />,
        isParent: false,
        external: false,
        disabled: false,
    },
];

function AppSidebar() {
    const pathname = usePathname();
    const { state, isMobile, setOpenMobile } = useSidebar();
    const isCollapsed = state === "collapsed";
    const handleNavClick = () => {
        if (isMobile) {
            // Close mobile sidebar after navigation
            setOpenMobile(false);
        }
    };
    
    return (
        <Sidebar collapsible="icon" className="h-full">
            <SidebarHeader className={`${isCollapsed ? 'px-2 py-4' : 'px-4 py-6'} max-[1439px]:px-3 max-[1439px]:py-4`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="flex items-center">
                        {isCollapsed ? (
                            <Book size={24} className="text-primary" />
                        ) : (
                            <span className="text-xl font-bold ml-2">Flipbook</span>
                        )}
                    </div>
                </div>
            </SidebarHeader>
            
            <SidebarContent className={`${isCollapsed ? 'px-2' : 'px-3'} max-[1439px]:px-2`}>
                <SidebarMenu className="space-y-1">
                    {sidebarNavItems.map((item) => (
                        <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                                asChild
                                size="lg"
                                isActive={pathname === item.url || (item.isParent && pathname?.startsWith(item.url))}
                                disabled={item.disabled}
                                className={`h-[48px] text-[14px] ${isCollapsed ? 'px-0 justify-center' : 'px-3 justify-start gap-3'} max-[1439px]:h-[44px]`}
                                tooltip={item.label}
                            >
                                <Link 
                                    href={item.url} 
                                    target={item.external ? "_blank" : undefined} 
                                    tabIndex={item.disabled ? -1 : 0} 
                                    aria-disabled={item.disabled}
                                    className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'justify-start gap-3 w-full'} max-[1439px]:gap-2`}
                                    onClick={handleNavClick}
                                >
                                    <span className={`flex items-center text-green-500 justify-center opacity-80 group-hover:opacity-100 group-data-[active=true]:opacity-100 ${isCollapsed ? 'w-full' : 'w-5 h-5'} max-[1439px]:w-4 max-[1439px]:h-4`}>
                                        {item.icon}
                                    </span>
                                    {!isCollapsed && (
                                        <span className="opacity-80 group-hover:opacity-100 group-data-[active=true]:opacity-100 max-[1439px]:text-[13px]">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            
            <SidebarSeparator className="mx-0" />
        
            <SidebarFooter className={`${isCollapsed ? 'px-2 pb-2' : 'px-3 pb-2'} max-[1439px]:px-2`}>
                <UserDetailsCard />
            </SidebarFooter>
            
            <SidebarArrowToggle />
        </Sidebar>
    );
}

export default AppSidebar;
