import { AppDataSource } from "../data-source";
import { User } from "../models/User";
import { FindOptionsWhere, ILike, MoreThanOrEqual, LessThanOrEqual, Equal, And, Not, LessThan, MoreThan } from "typeorm";
import { UserFilterDto } from "../dtos/filters.dto";

export const UserRepository = AppDataSource.getRepository(User);

const escapeLikeString = (str: string): string => {
  return str.replace(/[%_\\]/g, (match) => `\\${match}`);
};

export const findUserByEmail = async (email: string) => {
  return UserRepository.findOne({ where: { email } });
};

export const findUserById = async (id: string) => {
  return UserRepository.findOne({ where: { id } });
};

export const getAllUsers = async (filters?: UserFilterDto) => {
  const where: FindOptionsWhere<User> = {};

  if (filters?.email) {
    const sanitizedEmail = escapeLikeString(filters.email);
    where.email = ILike(`%${sanitizedEmail}%`);
  }

  if (filters?.dateOfBirthStart !== undefined && filters?.dateOfBirthEnd !== undefined) {
    if (filters.dateOfBirthStart > filters.dateOfBirthEnd) {
      throw new Error("dateOfBirthStart must be less than or equal to dateOfBirthEnd");
    }
    const rangeCondition = And(MoreThanOrEqual(filters.dateOfBirthStart), LessThanOrEqual(filters.dateOfBirthEnd));
    where.dateOfBirth = filters?.invertDateOfBirth ? Not(rangeCondition) : rangeCondition;
  } else if (filters?.dateOfBirthStart !== undefined) {
    where.dateOfBirth = filters?.invertDateOfBirth ? LessThan(filters.dateOfBirthStart) : MoreThanOrEqual(filters.dateOfBirthStart);
  } else if (filters?.dateOfBirthEnd !== undefined) {
    where.dateOfBirth = filters?.invertDateOfBirth ? MoreThan(filters.dateOfBirthEnd) : LessThanOrEqual(filters.dateOfBirthEnd);
  }

  if (filters?.gender) where.gender = Equal(filters.gender);
  if (filters?.isActive !== undefined) where.isActive = Equal(filters.isActive);

  const order: Record<string, "ASC" | "DESC"> = {};
  if (filters?.sortBy && filters.sortBy.length > 0) {
    const validFields = ["id", "email", "dateOfBirth", "gender", "isActive", "createdAt"];
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

  return UserRepository.find({
    where,
    order,
    skip: filters?.page && filters?.limit ? (filters.page - 1) * filters.limit : undefined,
    take: filters?.limit
  });
};

export const updateUser = async (id: string, data: Partial<User>) => {
  await UserRepository.update(id, data);
  return findUserById(id);
};

export const deleteUser = async (id: string) => {
  return UserRepository.delete(id);
};

export const createUser = async (user: Partial<User>) => {
  const entity = UserRepository.create(user);
  return UserRepository.save(entity);
};
