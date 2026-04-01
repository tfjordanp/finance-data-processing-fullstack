import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const drawerWidth = 260;

const navItems: { to: string; label: string; icon: ReactNode }[] = [
  { to: "/profile", label: "Profile", icon: <DashboardIcon /> },
  { to: "/users", label: "Users", icon: <PeopleIcon /> },
  { to: "/transactions", label: "Transactions", icon: <ReceiptLongIcon /> },
  { to: "/categories", label: "Categories", icon: <CategoryIcon /> },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <AccountBalanceWalletIcon sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Finance
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ mr: 2, display: { xs: "none", sm: "block" } }}>
              {user.email}
            </Typography>
          )}
          <IconButton color="inherit" onClick={() => logout()} aria-label="log out">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.to}
              selected={location.pathname === item.to}
              onClick={() => navigate(item.to)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
