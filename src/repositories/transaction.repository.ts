import { AppDataSource } from "../data-source";
import { Transaction } from "../models/Transaction";
import { FindOptionsWhere, ILike, MoreThanOrEqual, LessThanOrEqual, Equal, In, And, Not, LessThan, MoreThan } from "typeorm";
import { TransactionFilterDto } from "../dtos/filters.dto";

export const TransactionRepository = AppDataSource.getRepository(Transaction);

const escapeLikeString = (str: string): string => {
  return str.replace(/[%_\\]/g, (match) => `\\${match}`);
};

export const getAllTransactions = async (filters?: TransactionFilterDto) => {
  const where: FindOptionsWhere<Transaction> = {};

  if (filters?.amountMin !== undefined && filters?.amountMax !== undefined) {
    if (filters.amountMin > filters.amountMax) {
      throw new Error("amountMin must be less than or equal to amountMax");
    }
    const rangeCondition = And(MoreThanOrEqual(filters.amountMin), LessThanOrEqual(filters.amountMax));
    where.amount = filters?.invertAmount ? Not(rangeCondition) : rangeCondition;
  } else if (filters?.amountMin !== undefined) {
    where.amount = MoreThanOrEqual(filters.amountMin);
  } else if (filters?.amountMax !== undefined) {
    where.amount = LessThanOrEqual(filters.amountMax);
  }

  if (filters?.type) where.type = Equal(filters.type);
  if (filters?.categoryIds && filters.categoryIds.length > 0) {
    where.category = { id: In(filters.categoryIds) } as any;
  }

  if (filters?.dateStart !== undefined && filters?.dateEnd !== undefined) {
    if (filters.dateStart > filters.dateEnd) {
      throw new Error("dateStart must be less than or equal to dateEnd");
    }
    const rangeCondition = And(MoreThanOrEqual(filters.dateStart), LessThanOrEqual(filters.dateEnd));
    where.date = filters?.invertDate ? Not(rangeCondition) : rangeCondition;
  } else if (filters?.dateStart !== undefined) {
    where.date = MoreThanOrEqual(filters.dateStart);
  } else if (filters?.dateEnd !== undefined) {
    where.date = LessThanOrEqual(filters.dateEnd);
  }

  if (filters?.notes) {
    const sanitizedNotes = escapeLikeString(filters.notes);
    where.notes = ILike(`%${sanitizedNotes}%`);
  }

  const order: Record<string, "ASC" | "DESC"> = {};
  if (filters?.sortBy && filters.sortBy.length > 0) {
    const validFields = ["id", "amount", "type", "date", "notes"];
    const orders = filters.sortOrder || [];
    const seen = new Set<string>();
    filters.sortBy.forEach((field, index) => {
      const trimmedField = field.trim();
      if (validFields.includes(trimmedField) && !seen.has(trimmedField)) {
        seen.add(trimmedField);
        order[trimmedField] = (orders[index]?.trim().toUpperCase() as "ASC" | "DESC") || "ASC";
      }
    });
  }

  /*
  Note: It is possible to further optimize the query by only joining the Category table when categoryIds filter is provided. However, this adds complexity to the code and may not be worth it unless performance testing shows a significant benefit. For simplicity, we will always join the Category table since it's a common relation that may be needed for most queries.
  */
  if (filters?.withTotalCount) {
    const [data, total] = await TransactionRepository.findAndCount({
        where,
        order,
        relations: ["category"],
        skip: filters?.page && filters?.limit ? (filters.page - 1) * filters.limit : undefined,
        take: filters?.limit
    });
    return { data, total };
  }

  const data = await TransactionRepository.find({
    where,
    order,
    relations: ["category"],
    skip: filters?.page && filters?.limit ? (filters.page - 1) * filters.limit : undefined,
    take: filters?.limit
  });

  return data;
};

export const getTransactionById = async (id: string) => {
  return TransactionRepository.findOne({
    where: { id }
  });
};

export const createTransaction = async (transaction: Partial<Transaction>) => {
  const entity = TransactionRepository.create(transaction);
  return TransactionRepository.save(entity);
};

export const updateTransaction = async (id: string, data: Partial<Transaction>) => {
  await TransactionRepository.update(id, data);
  return TransactionRepository.findOne({ where: { id } });
};

export const deleteTransaction = async (id: string) => {
  return TransactionRepository.delete({ id });
};

