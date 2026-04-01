import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/client";
import { createUser, deleteUser, fetchUser, fetchUsers, updateUser } from "../api/financeApi";
import type { Gender, User } from "../api/types";
import { useAuth } from "../auth/AuthContext";

function UserForm({
  email,
  setEmail,
  password,
  setPassword,
  dateOfBirth,
  setDateOfBirth,
  gender,
  setGender,
  isActive,
  setIsActive,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  gender: Gender;
  setGender: (v: Gender) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
}) {
  return (
    <Stack spacing={2}>
      <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth required />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        required
      />
      <TextField
        label="Date of birth"
        type="date"
        value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
        fullWidth
        required
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <FormControl fullWidth>
        <InputLabel id="user-gender">Gender</InputLabel>
        <Select
          labelId="user-gender"
          label="Gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
        >
          <MenuItem value="male">Male</MenuItem>
          <MenuItem value="female">Female</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel
        control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
        label="Active account"
      />
    </Stack>
  );
}

export function UsersPage() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);

  const userForEdit = useQuery({
    queryKey: ["user", selected?.id],
    queryFn: () => fetchUser(selected!.id),
    enabled: editOpen && Boolean(selected),
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDateOfBirth("");
    setGender("male");
    setIsActive(true);
    setFormError(null);
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (u: User) => {
    setSelected(u);
    setFormError(null);
    setEditOpen(true);
  };

  useEffect(() => {
    if (!editOpen || !userForEdit.data) return;
    const u = userForEdit.data;
    setEmail(u.email);
    setPassword("");
    setDateOfBirth(u.dateOfBirth);
    setGender(u.gender);
    setIsActive(u.isActive);
  }, [editOpen, userForEdit.data]);

  const openDelete = (u: User) => {
    setSelected(u);
    setDeleteOpen(true);
  };

  const createMut = useMutation({
    mutationFn: () =>
      createUser({
        email: email.trim(),
        password,
        dateOfBirth,
        gender,
        isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setCreateOpen(false);
      resetForm();
    },
    onError: (err) => setFormError(getApiErrorMessage(err, "Create failed")),
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("No user");
      return updateUser(selected.id, {
        email: email.trim(),
        password,
        dateOfBirth,
        gender,
        isActive,
      });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user", updated.id] });
      setEditOpen(false);
      setSelected(null);
    },
    onError: (err) => setFormError(getApiErrorMessage(err, "Update failed")),
  });

  const deleteMut = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("No user");
      return deleteUser(selected.id);
    },
    onSuccess: () => {
      const deletedId = selected?.id;
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteOpen(false);
      setSelected(null);
      if (deletedId && authUser?.id === deletedId) {
        logout();
        navigate("/login", { replace: true });
      }
    },
    onError: (err) => setFormError(getApiErrorMessage(err, "Delete failed")),
  });

  if (q.isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );

  if (q.isError) return <Alert severity="error">{getApiErrorMessage(q.error, "Failed to load users")}</Alert>;

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Users</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New user
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Date of birth</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {q.data!.map((row) => {
              const isSelf = authUser?.id === row.id;
              return (
                <TableRow key={row.id} hover>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.dateOfBirth}</TableCell>
                  <TableCell>{row.gender}</TableCell>
                  <TableCell>{row.isActive ? "Yes" : "No"}</TableCell>
                  <TableCell align="right">
                    {isSelf ? (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(row)}>
                          Edit
                        </Button>
                        <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => openDelete(row)}>
                          Delete
                        </Button>
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        View or edit own profile only (API)
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={createOpen} onClose={() => !createMut.isPending && setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create user</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {formError && createOpen && <Alert severity="error">{formError}</Alert>}
            <Box sx={{ mt: formError ? 2 : 0 }}>
              <UserForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                dateOfBirth={dateOfBirth}
                setDateOfBirth={setDateOfBirth}
                gender={gender}
                setGender={setGender}
                isActive={isActive}
                setIsActive={setIsActive}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={createMut.isPending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => !updateMut.isPending && setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit user</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {userForEdit.isLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            )}
            {userForEdit.isError && (
              <Alert severity="error">{getApiErrorMessage(userForEdit.error, "Failed to load user")}</Alert>
            )}
            {formError && editOpen && <Alert severity="error">{formError}</Alert>}
            {!userForEdit.isLoading && userForEdit.data && (
              <Box sx={{ mt: formError ? 2 : 0 }}>
                <UserForm
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  dateOfBirth={dateOfBirth}
                  setDateOfBirth={setDateOfBirth}
                  gender={gender}
                  setGender={setGender}
                  isActive={isActive}
                  setIsActive={setIsActive}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={updateMut.isPending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => !deleteMut.isPending && setDeleteOpen(false)}>
        <DialogTitle>Delete account?</DialogTitle>
        <DialogContent>
          <Typography>This will remove {selected?.email}. You will be signed out if you delete yourself.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleteMut.isPending}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
