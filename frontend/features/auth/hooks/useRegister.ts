"use client";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/features/auth/services/auth.service";
import type { OwnerRegisterFormData } from "@/features/auth/types";
export default function useRegister() {
  const mutation = useMutation({
    mutationFn: (data: OwnerRegisterFormData) =>
      authService.registerOwner(data),
  });

  return mutation;
}
