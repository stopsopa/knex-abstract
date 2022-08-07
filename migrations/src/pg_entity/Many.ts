import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, JoinTable, ManyToMany, ManyToOne} from 'typeorm';

import {Users} from './Users';

@Entity()
export class Many {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50,
  })
  title: string;

  // http://typeorm.io/#/many-to-one-one-to-many-relations
  @ManyToOne((type) => Users, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({name: 'user_id'})
  user: Users;
}
