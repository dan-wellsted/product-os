import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/httpClient.js";
import { useToast } from "./useToast.js";

export function useApiMutation({ mutationFn, invalidateKeys = [], onSuccess, onError }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn,
    onSuccess: async (data, variables, context) => {
      if (invalidateKeys.length) {
        await Promise.all(
          invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
        );
      }
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (error instanceof ApiError) {
        if (error.status === 500) {
          addToast({
            status: "error",
            title: "Server error",
            description: error.message,
          });
        } else if (error.status === 409) {
          addToast({
            status: "warning",
            title: "Conflict",
            description: error.problem?.detail || "Duplicate record detected.",
          });
        }
      } else {
        addToast({
          status: "error",
          title: "Unexpected error",
          description: error?.message ?? "Something went wrong",
        });
      }
      onError?.(error, variables, context);
    },
  });
}
