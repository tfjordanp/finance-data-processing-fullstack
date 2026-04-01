import { AppDataSource } from "../data-source";
import { User } from "../models/User";

export const UserRepository = AppDataSource.getRepository(User);

export const findUserByEmail = async (email: string) => {
  return UserRepository.findOne({ where: { email } });
};

export const findUserById = async (id: string) => {
  return UserRepository.findOne({ where: { id } });
};

export const getAllUsers = async () => {
  return UserRepository.find({
    select: ["id", "email", "dateOfBirth", "gender", "isActive", "createdAt"]
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
