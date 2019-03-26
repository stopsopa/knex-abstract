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

    @Column("datetime", {
        default: () => 'CURRENT_TIMESTAMP', // available for DATETIME since MySQL 5.6.5 https://stackoverflow.com/a/168832/5560682
    })
    created: Date;

    @Column("datetime", {
        default: () => null,
        nullable: true,
        onUpdate: "CURRENT_TIMESTAMP" // available for DATETIME since MySQL 5.6.5 https://stackoverflow.com/a/168832/5560682
    })
    updated: Date;
}
