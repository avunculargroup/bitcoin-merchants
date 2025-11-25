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
    if (error.type === "CredentialsSignin") {
      return { error: "Invalid email or password" };
    }
    return { error: "An error occurred" };
  }
}

