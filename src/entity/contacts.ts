import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn, Unique } from "typeorm";

@Entity("contacts")
@Unique(["phoneNumber", "email"])
export class Contacts {
  @PrimaryGeneratedColumn({type: "int"})
  id!: number;

  @Column({ type: "varchar", length: 50, nullable: true })
  phoneNumber?: string | null;

  @Column({ type: "varchar", length: 1000, nullable: true })
  email?: string | null;

  @Column({ type: "int", nullable: true })
  linkedId?: number | null;

  @Column({ 
    type: "enum", 
    enum: ["primary", "secondary"], 
    default: "primary" 
  })
  linkPrecedence!: "primary" | "secondary";

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;

  @ManyToOne(() => Contacts, { nullable: true })
  @JoinColumn({ name: "linkedId" })
  linkedContact?: Contacts;
}