import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, RelationId } from "typeorm";
import { Category } from "./Category";

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("float")
  amount!: number;

  @Column({ type: "text" })
  type!: "income" | "expense";

  @ManyToOne(() => Category, { eager: true, nullable: false })
  @JoinColumn({ name: "categoryId" })
  category!: Category;

  @RelationId((transaction: Transaction) => transaction.category)
  categoryId!: string;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "text", default: "" })
  notes!: string;
}
