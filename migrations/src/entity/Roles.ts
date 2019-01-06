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
        default: () => 'CURRENT_TIMESTAMP', // available for DATETIME since MySQL 5.6.5 https://stackoverflow.com/a/168832/5560682
    })
    created: Date;

    @Column("datetime", {
        default: () => null,
        nullable: true,
        onUpdate: "CURRENT_TIMESTAMP"  // available for DATETIME since MySQL 5.6.5 https://stackoverflow.com/a/168832/5560682
    })
    updated: Date;
}
