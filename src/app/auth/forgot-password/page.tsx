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
import Logo from "@/components/layout/logo";
import { useAuth } from "@/hooks/useAuth";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { reset } = useAuth();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      await reset(data);
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "An error occurred while sending the reset link. Please try again later."
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
            className="text-3xl font-bold text-center 
                             text-gray-900 dark:text-[#f6f9fa]"
          >
            Reset Password
          </CardTitle>
          <CardDescription
            className="text-center   
                                  text-gray-600 dark:text-[#f6f9fa]/80"
          >
            Enter your email address to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-50 dark:bg-red-500/10 
                                                border border-red-100 dark:border-red-500/20"
            >
              <AlertDescription className="text-red-600 dark:text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {isSuccess ? (
            <Alert
              className="bg-teal-50 dark:bg-teal-500/10 
                                      border border-teal-100 dark:border-teal-500/20"
            >
              <AlertDescription className="text-teal-600 dark:text-teal-400">
                Password reset link has been sent to your email. Please check
                your inbox.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-[#f6f9fa]/80">
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
                      <FormMessage className="text-red-500 dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-teal-500 dark:bg-[#12e9ee] text-white 
                           dark:text-[#040a14] hover:bg-teal-600 
                           dark:hover:bg-[#12e9ee]/90 transition-all duration-300 
                             dark:glow-teal group"
                  disabled={isLoading}
                >
                  <span className="group-hover:scale-105 transition-transform inline-block">
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </span>
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div
            className="text-sm text-center   
                       text-gray-600 dark:text-[#f6f9fa]/80"
          >
            Remember your password?{" "}
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
