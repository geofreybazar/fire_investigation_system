import { useSuspenseQuery } from "@tanstack/react-query";
import userService from "@/service/user.service";

const useGetUser = (userId: string) => {
  const {
    data: user,
    isLoading,
    isFetching,
    status,
    isError,
    error,
  } = useSuspenseQuery({
    queryKey: ["user", userId],
    queryFn: () => userService.getUser(userId),
  });

  return { user, isLoading, isError, error, status, isFetching };
};

export default useGetUser;
