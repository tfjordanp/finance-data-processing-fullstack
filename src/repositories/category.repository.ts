import { AppDataSource } from "../data-source";
import { Category } from "../models/Category";

export const CategoryRepository = AppDataSource.getRepository(Category);

export const getAllCategories = async () => {
  return CategoryRepository.find({ order: { name: "ASC" } });
};
