"use client";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/features/auth/services/auth.service";
import type { LoginPayload } from "@/features/auth/types";

export default function useLogin() {
  const mutation = useMutation({
    mutationFn: (data: LoginPayload) => authService.login(data),
  });

  return mutation;
}
