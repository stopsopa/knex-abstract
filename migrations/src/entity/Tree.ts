import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    JoinTable,
    ManyToMany,
    Unique,
} from "typeorm";

@Entity('tree')
export class Tree {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        nullable: true,
    })
    parent_id: number;

    @Column({
        nullable: true,
    })
    sort: number;

    @Column({
        nullable: true,
    })
    l: number;

    @Column({
        nullable: true,
    })
    r: number;

    @Column({
        nullable: true,
    })
    level: number;

    @Column({
        length: 50
    })
    title: string;
}
