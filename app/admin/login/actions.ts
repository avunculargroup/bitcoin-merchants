"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Invalid email or password" };
    }

    redirect("/admin");
  } catch (error: any) {
    // Next.js redirect() throws a special error that should be re-thrown
    // Check for redirect errors by looking for the digest or type
    if (error?.digest?.startsWith('NEXT_REDIRECT') || 
        error?.digest === 'NEXT_REDIRECT' ||
        error?.message?.includes('NEXT_REDIRECT') ||
        error?.code === 'NEXT_REDIRECT') {
      throw error;
    }
    
    if (error.type === "CredentialsSignin") {
      return { error: "Invalid email or password" };
    }
    return { error: "An error occurred" };
  }
}

