import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "../api/client";
import { fetchProfile, updateUser } from "../api/financeApi";
import type { Gender } from "../api/types";
import { useAuth } from "../auth/AuthContext";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    enabled: Boolean(user?.id),
  });
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const openEdit = () => {
    if (!q.data) return;
    setEmail(q.data.email);
    setPassword("");
    setDateOfBirth(q.data.dateOfBirth);
    setGender(q.data.gender);
    setIsActive(q.data.isActive);
    setFormError(null);
    setOpen(true);
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Not signed in");
      return updateUser(user.id, {
        email: email.trim(),
        password,
        dateOfBirth,
        gender,
        isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
    },
    onError: (err) => setFormError(getApiErrorMessage(err, "Update failed")),
  });

  if (q.isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );

  if (q.isError)
    return <Alert severity="error">{getApiErrorMessage(q.error, "Failed to load profile")}</Alert>;

  const p = q.data!;

  return (
    <>
      <Card>
        <CardHeader title="Your profile" action={<Button startIcon={<EditIcon />} onClick={openEdit}>Edit</Button>} />
        <CardContent>
          <Stack spacing={1}>
            <Typography>
              <strong>Email:</strong> {p.email}
            </Typography>
            <Typography>
              <strong>Date of birth:</strong> {p.dateOfBirth}
            </Typography>
            <Typography>
              <strong>Gender:</strong> {p.gender}
            </Typography>
            <Typography>
              <strong>Active:</strong> {p.isActive ? "Yes" : "No"}
            </Typography>
            <Typography>
              <strong>Created:</strong> {formatDate(p.createdAt)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => !mutation.isPending && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit profile</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth required />
            <TextField
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              helperText="Required by API for every update"
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
              <InputLabel id="profile-gender">Gender</InputLabel>
              <Select
                labelId="profile-gender"
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
