import { useUserStore } from "@/store/userStore";
import { Navigate } from "react-router";

import Layout from "@/components/layout/Layout";
import Router from "@/components/app/Router";

const HomePage = () => {
  const user = useUserStore((state) => state.user);
  if (!user) {
    return <Navigate to='/login' replace />;
  }

  return (
    <Layout>
      <Router />
    </Layout>
  );
};

export default HomePage;
