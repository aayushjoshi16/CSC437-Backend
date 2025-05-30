import { Header } from "./Header.tsx";
import { Outlet } from "react-router-dom";

export function MainLayout() {
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
}
