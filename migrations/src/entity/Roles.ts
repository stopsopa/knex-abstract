import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
} from "typeorm";

// import { Photo } from './Photo';

@Entity()
export class Roles {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 10
    })
    name: string;


    @Column("datetime", {
        default: () => 'CURRENT_TIMESTAMP',
    })
    created: Date;

    @Column("datetime", {
        default: () => null,
        nullable: true,
        onUpdate: "CURRENT_TIMESTAMP"
    })
    updated: Date;
}
