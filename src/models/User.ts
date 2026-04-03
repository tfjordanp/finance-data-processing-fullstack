import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: "date" })
  dateOfBirth!: string;

  @Column({ type: "text" })
  gender!: "male" | "female";

  @Column({ type: "text" })
  role!: "viewer" | "analyst" | "admin";

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
