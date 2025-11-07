import { useToastContext } from "../components/ToastProvider.jsx";

export function useToast() {
  const { addToast, removeToast } = useToastContext();
  return { addToast, removeToast };
}
