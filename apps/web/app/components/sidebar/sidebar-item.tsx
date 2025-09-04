'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export interface SidebarItemPropsType {
  label: string;
  id: string;
  url: string;
  icon?: React.ReactNode;
  isParent?: boolean;
  external?: boolean;
  disabled?: boolean;
}

function SidebarItem({
  label,
  id,
  url,
  icon,
  isParent,
  external,
  disabled
}: SidebarItemPropsType) {

  const pathname = usePathname();

  const isActive = useMemo(() => { return pathname ? (pathname.includes(url) || (isParent && pathname === url)) : false }, [pathname, url, isParent]);

  console.log(`SidebarItem: ${label}, isActive: ${isActive}, url: ${url}, pathname: ${pathname}`);

  return (
    <div
      key={id}
      className={`group transition-all ease-in-out px-3 rounded-md w-full flex 
      ${disabled ? "cursor-not-allowed" : "cursor-pointer dark:hover:bg-[#2F2F2F]"}  
      ${isActive ? "dark:bg-[#2F2F2F]" : "bg-transparent"} 
      relative dark:text-white overflow-hidden`}>
      <Link
        className={`w-full ${disabled ? "pointer-events-none cursor-not-allowed opacity-40" : ""}`}
        href={url}
        target={external ? "_blank" : "_self"}
      >
        <div className="h-[48px] flex w-full items-center justify-between text-lg transition-opacity ease-in-out duration-700">
          <div className="inline-flex space-x-2 items-center">
            <div className={`opacity-80 
            ${disabled ? "" : "group-hover:dark:opacity-100"} 
            ${isActive ? "dark:opacity-100" : ""}`}>{icon}</div>
            <div
              className={`
              block text-left line-clamp-1 overflow-ellipsis whitespace-nowrap text-[14px] opacity-80 
              ${disabled ? "" : "group-hover:dark:opacity-100 transition-all duration-300"} 
              ${isActive ? "dark:opacity-100" : ""}
            `}
            >
              {label}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default SidebarItem;
