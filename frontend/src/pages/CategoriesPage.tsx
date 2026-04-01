import {
  Alert,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "../api/client";
import { fetchCategories } from "../api/financeApi";

export function CategoriesPage() {
  const q = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  if (q.isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );

  if (q.isError) return <Alert severity="error">{getApiErrorMessage(q.error, "Failed to load categories")}</Alert>;

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Categories
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Read-only list from GET /api/categories.
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {q.data!.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.name}</TableCell>
                <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{row.id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
