"use client";

import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-4 py-4 hidden md:flex md:flex-col bg-white border-r border-gray-200 w-[279px] shrink-0 overflow-x-hidden",
          className
        )}
        animate={{
          width: animate ? (open ? "279px" : "99px") : "279px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-800 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-white cursor-pointer hover:text-indigo-400 transition-colors"
            onClick={() => setOpen(!open)}
            size={24}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-neutral-900/95 backdrop-blur-sm p-6 z-[100] flex flex-col justify-start pt-20",
                className
              )}
            >
              <div
                className="absolute right-6 top-6 z-50 text-white hover:text-indigo-400 cursor-pointer transition-colors"
                onClick={() => setOpen(!open)}
              >
                <IconX size={24} />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  // Determine if this is the active link
  const isActive = typeof window !== 'undefined' && window.location.pathname === link.href;
  // Special case for logout
  const isLogout = link.label && link.label.toLowerCase().includes('logout');
  return (
    <a
      href={link.href}
      className={cn(
        'flex items-center justify-start gap-3 group/sidebar py-3 px-3 rounded-lg transition-colors duration-200',
        isActive
          ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
          : isLogout
            ? 'text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold'
            : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700',
        className
      )}
      {...props}
    >
      <span className={cn(
        'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 flex-shrink-0',
        isActive
          ? 'bg-blue-100 text-blue-600'
          : isLogout
            ? 'bg-red-50 text-red-600'
            : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-700'
      )}>
        {link.icon}
      </span>
      <motion.span
        animate={{
          display: animate ? 'inline-block' : 'none',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          'text-sm whitespace-pre inline-block !p-0 !m-0',
          isActive ? 'text-blue-700' : isLogout ? 'text-red-600' : 'text-gray-700'
        )}
      >
        {link.label}
      </motion.span>
    </a>
  );
};
