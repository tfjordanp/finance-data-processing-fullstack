import { User } from "../models/User";
import { Transaction } from "../models/Transaction";

export type UserFilterDto = {
  email?: string;
  dateOfBirthStart?: string;
  dateOfBirthEnd?: string;
  invertDateOfBirth?: boolean;
  gender?: User["gender"];
  isActive?: boolean;
  // Pagination and sorting
  page?: number;
  limit?: number;
  sortBy?: string[];
  sortOrder?: string[];
};

export type TransactionFilterDto = {
  amountMin?: number;
  amountMax?: number;
  invertAmount?: boolean;
  type?: Transaction["type"];
  categoryIds?: string[];
  dateStart?: string;
  dateEnd?: string;
  invertDate?: boolean;
  notes?: string;
  // Pagination and sorting
  page?: number;
  limit?: number;
  sortBy?: string[];
  sortOrder?: string[];
};
