"use client";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/features/auth/services/auth.service";

export default function useLogout() {
  const mutation = useMutation({
    mutationFn: () => authService.logout(),
  });

  return mutation;
}
