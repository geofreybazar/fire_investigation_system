import { useMutation } from "@tanstack/react-query";
import authService from "@/service/auth.service";

const useLogin = () => {
  const {
    mutateAsync: login,
    isPending,
    isError,
    error,
    isSuccess,
    data,
  } = useMutation({
    mutationFn: authService.login,
  });
  return { login, isPending, isError, error, isSuccess, data };
};

export default useLogin;
