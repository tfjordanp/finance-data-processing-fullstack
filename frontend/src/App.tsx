import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { MainLayout } from "./layout/MainLayout";
import { CategoriesPage } from "./pages/CategoriesPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { UsersPage } from "./pages/UsersPage";
import { RequireAuth } from "./routes/RequireAuth";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/transactions" replace />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/transactions" replace />} />
      </Routes>
    </AuthProvider>
  );
}
