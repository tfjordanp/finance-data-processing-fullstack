import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
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
import { useMemo, useState } from "react";
import { getApiErrorMessage } from "../api/client";
import {
  createTransaction,
  deleteTransaction,
  fetchCategories,
  fetchTransaction,
  fetchTransactions,
  patchTransaction,
} from "../api/financeApi";
import type { Transaction, TransactionType } from "../api/types";

function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isDateNotFuture(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date <= now;
}

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const txQuery = useQuery({ queryKey: ["transactions"], queryFn: fetchTransactions });
  const catQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["transaction", selectedId],
    queryFn: () => fetchTransaction(selectedId!),
    enabled: detailOpen && Boolean(selectedId),
  });

  const categories = catQuery.data ?? [];
  const firstCategoryId = categories[0]?.id ?? "";

  const resetForm = (defaultCategory: string) => {
    setAmount("");
    setType("expense");
    setCategoryId(defaultCategory);
    setDate(todayISODate());
    setNotes("");
    setFormError(null);
  };

  const openCreate = () => {
    resetForm(firstCategoryId || "");
    setCreateOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setSelectedId(t.id);
    setAmount(String(t.amount));
    setType(t.type);
    setCategoryId(t.categoryId);
    setDate(t.date);
    setNotes(t.notes ?? "");
    setFormError(null);
    setEditOpen(true);
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const openDelete = (id: string) => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  const parseAmount = (): number | null => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : null;
  };

  const validateForm = (): boolean => {
    const a = parseAmount();
    if (a === null) {
      setFormError("Amount must be a number");
      return false;
    }
    if (!categoryId.trim()) {
      setFormError("Category is required");
      return false;
    }
    if (!date || !isDateNotFuture(date)) {
      setFormError("Date must be today or in the past");
      return false;
    }
    setFormError(null);
    return true;
  };

  const createMut = useMutation({
    mutationFn: () => {
      if (!validateForm()) throw new Error("Invalid");
      const a = parseAmount()!;
      return createTransaction({
        amount: a,
        type,
        categoryId,
        date,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setCreateOpen(false);
      resetForm(firstCategoryId || "");
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "Invalid") return;
      setFormError(getApiErrorMessage(err, "Create failed"));
    },
  });

  const patchMut = useMutation({
    mutationFn: () => {
      if (!selectedId) throw new Error("No id");
      if (!validateForm()) throw new Error("Invalid");
      const a = parseAmount()!;
      return patchTransaction(selectedId, {
        amount: a,
        type,
        categoryId,
        date,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", selectedId] });
      setEditOpen(false);
      setSelectedId(null);
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "Invalid") return;
      setFormError(getApiErrorMessage(err, "Update failed"));
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => {
      if (!selectedId) throw new Error("No id");
      return deleteTransaction(selectedId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setDeleteOpen(false);
      setSelectedId(null);
    },
    onError: (err) => setFormError(getApiErrorMessage(err, "Delete failed")),
  });

  const formFields = useMemo(
    () => (
      <Stack spacing={2}>
        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
          required
          inputProps={{ step: "0.01" }}
        />
        <FormControl fullWidth>
          <InputLabel id="tx-type">Type</InputLabel>
          <Select labelId="tx-type" label="Type" value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth required>
          <InputLabel id="tx-cat">Category</InputLabel>
          <Select
            labelId="tx-cat"
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={categories.length === 0}
          >
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          fullWidth
          required
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline minRows={2} />
      </Stack>
    ),
    [amount, type, categoryId, date, notes, categories]
  );

  if (txQuery.isLoading || catQuery.isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );

  if (txQuery.isError) return <Alert severity="error">{getApiErrorMessage(txQuery.error, "Failed to load transactions")}</Alert>;
  if (catQuery.isError) return <Alert severity="error">{getApiErrorMessage(catQuery.error, "Failed to load categories")}</Alert>;

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Transactions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={categories.length === 0}>
          New transaction
        </Button>
      </Stack>

      {categories.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No categories available. Seed the API database first.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {txQuery.data!.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.date}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.type}
                    color={row.type === "income" ? "success" : "default"}
                  />
                </TableCell>
                <TableCell>{row.amount.toFixed(2)}</TableCell>
                <TableCell>{row.category?.name ?? "—"}</TableCell>
                <TableCell sx={{ maxWidth: 220 }}>{row.notes || "—"}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" startIcon={<VisibilityIcon />} onClick={() => openDetail(row.id)}>
                      Details
                    </Button>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(row)}>
                      Edit
                    </Button>
                    <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => openDelete(row.id)}>
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={createOpen} onClose={() => !createMut.isPending && setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New transaction</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {formError && createOpen && <Alert severity="error">{formError}</Alert>}
            <Box sx={{ mt: formError ? 2 : 0 }}>{formFields}</Box>
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

      <Dialog open={editOpen} onClose={() => !patchMut.isPending && setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit transaction</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {formError && editOpen && <Alert severity="error">{formError}</Alert>}
            <Box sx={{ mt: formError ? 2 : 0 }}>{formFields}</Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={patchMut.isPending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => patchMut.mutate()} disabled={patchMut.isPending}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Transaction details</DialogTitle>
        <DialogContent>
          {detailQuery.isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          )}
          {detailQuery.isError && <Alert severity="error">{getApiErrorMessage(detailQuery.error, "Load failed")}</Alert>}
          {detailQuery.data && (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography>
                <strong>ID:</strong> {detailQuery.data.id}
              </Typography>
              <Typography>
                <strong>Date:</strong> {detailQuery.data.date}
              </Typography>
              <Typography>
                <strong>Type:</strong> {detailQuery.data.type}
              </Typography>
              <Typography>
                <strong>Amount:</strong> {detailQuery.data.amount.toFixed(2)}
              </Typography>
              <Typography>
                <strong>Category:</strong> {detailQuery.data.category?.name ?? detailQuery.data.categoryId}
              </Typography>
              <Typography>
                <strong>Notes:</strong> {detailQuery.data.notes || "—"}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => !deleteMut.isPending && setDeleteOpen(false)}>
        <DialogTitle>Delete transaction?</DialogTitle>
        <DialogContent>
          <Typography>This cannot be undone.</Typography>
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
