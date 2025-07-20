"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  CheckCircle, 
  User, 
  Key, 
  Calendar, 
  Users,
  Home,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import { useTheme } from "next-themes";
import { ModernSidebar, ModernSidebarBody, SidebarLink } from "@/components/ui/modern-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

const sidebarLinks = [
  { label: "Dashboard", href: "/user/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Mentors", href: "/user/mentors", icon: <Users className="h-5 w-5" /> },
  { label: "Events", href: "/user/events", icon: <Calendar className="h-5 w-5" /> },
  { label: "Profile", href: "/user/profile", icon: <User className="h-5 w-5" /> },
  { label: "Settings", href: "/user/settings", icon: <Settings className="h-5 w-5" /> },
];

const notifications = [
  {
    id: 1,
    title: "New Mentor Match",
    description: "Dr. Sarah Chen has accepted your mentorship request",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    title: "Upcoming Workshop",
    description: "Don't forget about the Pitch Workshop tomorrow",
    time: "5 hours ago",
    unread: true,
  },
  {
    id: 3,
    title: "Profile Update",
    description: "Please complete your startup profile",
    time: "1 day ago",
    unread: true,
  },
];

export default function UserDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, setTheme } = useTheme();
  
  const userName = "Utkarsh";
  const userEmail = "utkarsh@example.com";
  const notificationCount = notifications.filter(n => n.unread).length;
  const progress = 66; // 2 out of 3 steps completed

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background">
      <ModernSidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <ModernSidebarBody className="border-r">
          <div className="mb-8 px-4">
            <h1 className="text-xl font-bold text-primary">RCOEM-TBI</h1>
          </div>
          <div className="space-y-2">
            {sidebarLinks.map((link) => (
              <SidebarLink key={link.label} link={link} />
            ))}
          </div>
          <div className="mt-auto pt-4">
            <SidebarLink
              link={{
                label: "Logout",
                href: "/logout",
                icon: <LogOut className="h-5 w-5" />,
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            />
          </div>
        </ModernSidebarBody>
      </ModernSidebar>

      <div className="flex-1 overflow-auto">
        <div className="space-y-8 p-8">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} />
                <AvatarFallback>{userName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold"
                >
                  Hi {userName} 👋 Welcome back!
                </motion.h1>
                <p className="text-muted-foreground">{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative"
                  >
                    <Bell className="h-5 w-5" />
                    <AnimatePresence>
                      {notificationCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center"
                        >
                          {notificationCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="p-3 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 mt-2 rounded-full bg-primary" 
                             style={{ opacity: notification.unread ? 1 : 0 }} />
                        <div className="flex-1">
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <span className="h-5 w-5">🌓</span>
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Welcome Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full"
            >
              <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
                    🎉 Congratulations, {userName}!
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Your journey with RCEOM-TBI begins here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center p-4 rounded-lg bg-green-500/10 border border-green-500/30"
                  >
                    <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
                    <div>
                      <p className="font-semibold text-green-300">Your application has been Accepted!</p>
                      <p className="text-sm text-green-400/80">
                        You now have full access to all RCEOM-TBI resources and mentorship opportunities.
                      </p>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Setup Progress */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="col-span-full md:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Account Setup Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{progress}% Complete</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <div className="space-y-4">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg border bg-green-500/10 border-green-500/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Key className="h-5 w-5 text-green-400" />
                        <div>
                          <h4 className="font-semibold">Password Setup</h4>
                          <p className="text-sm opacity-80">Set a strong password for your account</p>
                        </div>
                      </div>
                      <Badge variant="success" className="flex items-center gap-1">
                        completed <CheckCircle className="h-3 w-3" />
                      </Badge>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg border bg-yellow-500/10 border-yellow-500/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-yellow-400" />
                        <div>
                          <h4 className="font-semibold">Profile Completion</h4>
                          <p className="text-sm opacity-80">Complete your startup profile</p>
                        </div>
                      </div>
                      <Badge variant="warning" className="flex items-center gap-1">
                        pending <ChevronRight className="h-3 w-3" />
                      </Badge>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg border bg-red-500/10 border-red-500/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-red-400" />
                        <div>
                          <h4 className="font-semibold">Notification Setup</h4>
                          <p className="text-sm opacity-80">Configure your notification preferences</p>
                        </div>
                      </div>
                      <Badge variant="error" className="flex items-center gap-1">
                        incomplete <ChevronRight className="h-3 w-3" />
                      </Badge>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Mentorship Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Featured Mentors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Dr. Sarah Chen', expertise: 'AI & ML', availability: 'Available Now' },
                      { name: 'John Smith', expertise: 'Business Strategy', availability: 'Next Week' },
                      { name: 'Maria Garcia', expertise: 'Product Design', availability: 'Available Now' }
                    ].map((mentor, i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 transition-colors"
                      >
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${mentor.name}`} />
                          <AvatarFallback>{mentor.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{mentor.name}</h4>
                          <p className="text-sm text-muted-foreground">{mentor.expertise}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Connect
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Events Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: 'Startup Pitch Workshop', date: '2024-04-15', type: 'Workshop', spots: '5 spots left' },
                      { title: 'Networking Mixer', date: '2024-04-20', type: 'Networking', spots: '12 spots left' },
                      { title: 'Investor Meet', date: '2024-04-25', type: 'Pitch', spots: '3 spots left' }
                    ].map((event, i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="p-3 rounded-lg border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{event.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-2">{event.title}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{event.spots}</span>
                          <Button variant="outline" size="sm">
                            Register
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
