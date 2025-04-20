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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/layout/logo";

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters" }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    phone: z.string().optional(),
    confirmPassword: z.string(),
    terms: z.boolean().refine((value) => value === true, {
      message: "You must accept the terms and conditions to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      confirmPassword: "",
      terms: false,
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      await register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
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
        <CardHeader className="space-y-1 py-4">
          <div className="flex justify-center">
            <Logo />
          </div>
          <CardTitle
            className="text-2xl font-clash-display font-bold text-center 
                             text-gray-900 dark:text-[#f6f9fa]"
          >
            Create Account
          </CardTitle>
          <CardDescription
            className="text-center text-sm font-clash-grotesk 
                                  text-gray-600 dark:text-[#f6f9fa]/80"
          >
            Enter your details below to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-2">
          {error && (
            <Alert
              variant="destructive"
              className="mb-4 bg-red-50 dark:bg-red-500/10 
                                                border border-red-100 dark:border-red-500/20"
            >
              <AlertDescription className="text-red-600 dark:text-red-400 text-sm font-clash-grotesk">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-clash-grotesk text-gray-700 dark:text-[#f6f9fa]/80">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          className="h-9 text-sm border border-gray-200 dark:border-[#12e9ee]/20 
                                   bg-white dark:bg-[#062f3a] text-gray-800 
                                   dark:text-[#f6f9fa] focus:ring-2 
                                   focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                                   font-clash-grotesk transition-all duration-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 dark:text-red-400 font-clash-grotesk" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-clash-grotesk text-gray-700 dark:text-[#f6f9fa]/80">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          className="h-9 text-sm border border-gray-200 dark:border-[#12e9ee]/20 
                                   bg-white dark:bg-[#062f3a] text-gray-800 
                                   dark:text-[#f6f9fa] focus:ring-2 
                                   focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                                   font-clash-grotesk transition-all duration-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 dark:text-red-400 font-clash-grotesk" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-clash-grotesk text-gray-700 dark:text-[#f6f9fa]/80">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="mail@example.com"
                          className="h-9 text-sm border border-gray-200 dark:border-[#12e9ee]/20 
                                   bg-white dark:bg-[#062f3a] text-gray-800 
                                   dark:text-[#f6f9fa] focus:ring-2 
                                   focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                                   font-clash-grotesk transition-all duration-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 dark:text-red-400 font-clash-grotesk" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-clash-grotesk text-gray-700 dark:text-[#f6f9fa]/80">
                        Phone (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+1234567890"
                          className="h-9 text-sm border border-gray-200 dark:border-[#12e9ee]/20 
                                   bg-white dark:bg-[#062f3a] text-gray-800 
                                   dark:text-[#f6f9fa] focus:ring-2 
                                   focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                                   font-clash-grotesk transition-all duration-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 dark:text-red-400 font-clash-grotesk" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-clash-grotesk text-gray-700 dark:text-[#f6f9fa]/80">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-9 text-sm border border-gray-200 dark:border-[#12e9ee]/20 
                                     bg-white dark:bg-[#062f3a] text-gray-800 
                                     dark:text-[#f6f9fa] focus:ring-2 
                                     focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                                     font-clash-grotesk transition-all duration-300"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-2 py-1 
                                     text-gray-400 dark:text-[#f6f9fa]/60 
                                     hover:text-teal-500 dark:hover:text-[#12e9ee] 
                                     transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOffIcon className="h-3 w-3" />
                            ) : (
                              <EyeIcon className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 dark:text-red-400 font-clash-grotesk" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-clash-grotesk text-gray-700 dark:text-[#f6f9fa]/80">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-9 text-sm border border-gray-200 dark:border-[#12e9ee]/20 
                                     bg-white dark:bg-[#062f3a] text-gray-800 
                                     dark:text-[#f6f9fa] focus:ring-2 
                                     focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                                     font-clash-grotesk transition-all duration-300"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-2 py-1 
                                     text-gray-400 dark:text-[#f6f9fa]/60 
                                     hover:text-teal-500 dark:hover:text-[#12e9ee] 
                                     transition-colors"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOffIcon className="h-3 w-3" />
                            ) : (
                              <EyeIcon className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 dark:text-red-400 font-clash-grotesk" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem
                    className="flex flex-row items-start space-x-2 space-y-0 
                             rounded-md py-2 px-3 border border-gray-200 
                             dark:border-[#12e9ee]/20 bg-gray-50 
                             dark:bg-[#062f3a]/50"
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-1 border-gray-300 dark:border-[#12e9ee]/40
                               data-[state=checked]:bg-teal-500 
                               dark:data-[state=checked]:bg-[#12e9ee]
                               data-[state=checked]:border-teal-500
                               dark:data-[state=checked]:border-[#12e9ee]"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs font-clash-grotesk text-gray-700 dark:text-[#f6f9fa]/80">
                        I agree to the{" "}
                        <Link
                          href="/terms"
                          className="text-teal-500 dark:text-[#12e9ee] hover:text-teal-600 
                                 dark:hover:text-[#12e9ee]/90 underline-offset-4 
                                 hover:underline transition-colors"
                        >
                          terms of service
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="/privacy"
                          className="text-teal-500 dark:text-[#12e9ee] hover:text-teal-600 
                                 dark:hover:text-[#12e9ee]/90 underline-offset-4 
                                 hover:underline transition-colors"
                        >
                          privacy policy
                        </Link>
                      </FormLabel>
                      <FormMessage className="text-xs text-red-500 dark:text-red-400 font-clash-grotesk" />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-9 bg-teal-500 dark:bg-[#12e9ee] text-white 
                       dark:text-[#040a14] hover:bg-teal-600 
                       dark:hover:bg-[#12e9ee]/90 transition-all duration-300 
                       font-clash-grotesk dark:glow-teal group"
                disabled={isLoading}
              >
                <span className="text-sm group-hover:scale-105 transition-transform inline-block">
                  {isLoading ? "Creating Account..." : "Create Account"}
                </span>
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="pt-0 pb-4">
          <div
            className="text-xs text-center w-full font-clash-grotesk 
                     text-gray-600 dark:text-[#f6f9fa]/80"
          >
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-teal-500 dark:text-[#12e9ee] hover:text-teal-600 
                   dark:hover:text-[#12e9ee]/90 underline-offset-4 
                   hover:underline transition-colors"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
