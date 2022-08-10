import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, JoinTable, ManyToMany, Unique} from 'typeorm';

@Entity('tree')
export class Tree {
  @PrimaryGeneratedColumn()
  tid: number;

  @Column({
    nullable: true,
  })
  tparent_id: number;

  @Column({
    nullable: true,
  })
  tsort: number;

  @Column({
    nullable: true,
  })
  tl: number;

  @Column({
    nullable: true,
  })
  tr: number;

  @Column({
    nullable: true,
  })
  tlevel: number;

  @Column({
    length: 50,
  })
  title: string;

  @Column('datetime', {
    default: () => 'CURRENT_TIMESTAMP', // available for DATETIME since MySQL 5.6.5 https://stackoverflow.com/a/168832/5560682
  })
  created: Date;

  @Column('datetime', {
    default: () => null,
    nullable: true,
    onUpdate: 'CURRENT_TIMESTAMP', // available for DATETIME since MySQL 5.6.5 https://stackoverflow.com/a/168832/5560682
  })
  updated: Date;
}
