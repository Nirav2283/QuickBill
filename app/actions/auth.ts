"use server";

import { prisma } from "@/app/lib/db";
import { createSession, deleteSession } from "@/app/lib/session";
import { LoginFormSchema, LoginFormState } from "@/app/lib/definitions";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function login(
  state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  // 1. Validate form fields
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  // 2. Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return {
      message: "Invalid email or password.",
    };
  }

  // 3. Check if user is active
  if (!user.isActive) {
    return {
      message: "Your account has been deactivated. Contact an administrator.",
    };
  }

  // 4. Verify password
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return {
      message: "Invalid email or password.",
    };
  }

  // 5. Create session
  await createSession(user.id, user.role);

  // 6. Redirect to dashboard
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
