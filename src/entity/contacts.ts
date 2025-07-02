import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn } from "typeorm";

@Entity("contacts")
export class Contacts {
  @PrimaryGeneratedColumn({type: "int"})
  id!: number;

  @Column({ type: "varchar", length: 50, nullable: true })
  phoneNumber?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  email?: string;

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