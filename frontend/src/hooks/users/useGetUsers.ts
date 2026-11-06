import { useSuspenseQuery } from "@tanstack/react-query";
import userService from "@/service/user.service";
import type { Rank } from "@/constants/personnel";

const useGetUsers = (
  page: number,
  searchQuery: string,
  officeId: string,
  rank: Rank | undefined,
  status: "Active" | "Inactive",
) => {
  const {
    data: users,
    isLoading,
    isFetching,
    isError,
    error,
  } = useSuspenseQuery({
    queryKey: ["user", page, searchQuery, officeId, rank, status],
    queryFn: () =>
      userService.getUsers(page, searchQuery, officeId, rank, status),
  });

  return { users, isLoading, isError, error, status, isFetching };
};

export default useGetUsers;
