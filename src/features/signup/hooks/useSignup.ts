"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { SignupRequest, SignupResponse } from "../lib/dto";
import { SignupResponseSchema } from "../lib/dto";

const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  try {
    const response = await apiClient.post("/signup", data);
    return SignupResponseSchema.parse(response.data);
  } catch (error) {
    const message = extractApiErrorMessage(error, "회원가입에 실패했습니다.");
    throw new Error(message);
  }
};

export const useSignup = () => {
  return useMutation({
    mutationFn: signup,
  });
};
