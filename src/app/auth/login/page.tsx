"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/layout/logo";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      await login(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#040a14] flex items-center justify-center p-4">
      <Card
        className="w-full max-w-md bg-white dark:dark-card shadow-lg dark:shadow-[#12e9ee]/5
                    dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a]
                    rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 
                    backdrop-blur-sm transition-all duration-300"
      >
        <CardHeader className="space-y-1 pb-6">
          <Logo />
          <CardTitle
            className="text-3xl   font-bold text-center 
                             text-gray-900 dark:text-[#f6f9fa]"
          >
            Dashboard
          </CardTitle>
          <CardDescription
            className="text-center   
                                  text-gray-600 dark:text-[#f6f9fa]/80"
          >
            Enter your credentials to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-50 dark:bg-red-500/10 
                                                border border-red-100 dark:border-red-500/20"
            >
              <AlertDescription className="text-red-600 dark:text-red-400  ">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="  text-gray-700 dark:text-[#f6f9fa]/80">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="mail@example.com"
                        className="border border-gray-200 dark:border-[#12e9ee]/20 
                                 bg-white dark:bg-[#062f3a] text-gray-800 
                                 dark:text-[#f6f9fa] focus:ring-2 
                                 focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                                   transition-all duration-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 dark:text-red-400  " />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="  text-gray-700 dark:text-[#f6f9fa]/80">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="border border-gray-200 dark:border-[#12e9ee]/20 
                                   bg-white dark:bg-[#062f3a] text-gray-800 
                                   dark:text-[#f6f9fa] focus:ring-2 
                                   focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                                     transition-all duration-300"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-1 
                                   text-gray-400 dark:text-[#f6f9fa]/60 
                                   hover:text-teal-500 dark:hover:text-[#12e9ee] 
                                   transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOffIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 dark:text-red-400  " />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm   text-teal-500 dark:text-[#12e9ee] 
                           hover:text-teal-600 dark:hover:text-[#12e9ee]/90 
                           underline-offset-4 hover:underline transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-teal-500 dark:bg-[#12e9ee] text-white 
                         dark:text-[#040a14] hover:bg-teal-600 
                         dark:hover:bg-[#12e9ee]/90 transition-all duration-300 
                           dark:glow-teal group"
                disabled={isLoading}
              >
                <span className="group-hover:scale-105 transition-transform inline-block">
                  {isLoading ? "Signing in..." : "Sign In"}
                </span>
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div
            className="text-sm text-center   
                       text-gray-600 dark:text-[#f6f9fa]/80"
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-teal-500 dark:text-[#12e9ee] hover:text-teal-600 
                     dark:hover:text-[#12e9ee]/90 underline-offset-4 
                     hover:underline transition-colors"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
