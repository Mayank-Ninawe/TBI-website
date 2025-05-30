
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLoginForm from "@/components/auth/admin-login-form";
import UserLoginForm from "@/components/auth/user-login-form";
import { InnoNexusLogo } from "@/components/icons/innnexus-logo"; 
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="mb-8 text-center">
        <Link href="/" aria-label="Go to homepage">
          <InnoNexusLogo className="h-12 w-auto mx-auto mb-2 text-accent" /> {/* Logo color to accent */}
        </Link>
        <h1 className="font-montserrat text-3xl font-bold text-accent"> {/* Title to accent */}
          Welcome Back
        </h1>
        <p className="text-muted-foreground">
          Sign in to access your RCEOM-TBI account.
        </p>
      </div>
      <Tabs defaultValue="user" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user" className="font-poppins">User Login</TabsTrigger>
          <TabsTrigger value="admin" className="font-poppins">Admin Login</TabsTrigger>
        </TabsList>
        <TabsContent value="user">
          <UserLoginForm />
        </TabsContent>
        <TabsContent value="admin">
          <AdminLoginForm />
        </TabsContent>
      </Tabs>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="#contact" className="underline hover:text-accent"> {/* Link hover to accent */}
          Apply for Incubation
        </Link>
      </p>
    </div>
  );
}
