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

import { Roles } from './Roles';

@Entity('users')
@Unique(['email']) // http://typeorm.io/#/decorator-reference/unique
export class Users {

    @PrimaryGeneratedColumn()
    id: number;

    /**
     * Collumn types: https://github.com/typeorm/typeorm/blob/master/src/driver/types/ColumnTypes.ts
     */
    @Column({
        length: 50
    })
    firstName: string;

    @Column({
        length: 50
    })
    lastName: string;

    @Column({
        length: 255
    })
    email: string;

    @Column({
        length: 255
    })
    password: string;

    /**
        @Column('smallint', {
            default: () => 0
        })

     replace:
     ALTER TABLE `users` ADD `enabled` smallint NOT NULL DEFAULT 0;
     with:
     ALTER TABLE roles CHANGE `enabled` `enabled` smallint NOT NULL DEFAULT 0;
     or multiple columns at once:
     ALTER TABLE users CHANGE email email VARCHAR(252) NOT NULL, CHANGE updated updated DATETIME on update CURRENT_TIMESTAMP;


     Migration will look like this:

     export class auto1544795794171 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `users` CHANGE `enabled` `enabled` smallint NOT NULL DEFAULT 0");
    }
    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `users` CHANGE `enabled` `enabled` tinyint(1) NOT NULL DEFAULT '0'");
    }
}
     */
    @Column({
        precision:1 ,
        default: () => '0'
    })
    enabled: boolean;

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

    @Column("mediumtext", {
        default: () => null,
        nullable: true,
    })
    config: null;

    @ManyToMany(
        type => Roles,
        {
            onDelete: "RESTRICT"
        }
    )
    @JoinTable({
        name: "user_role",
        joinColumns: [
            { name: 'user_id' }
        ],
        inverseJoinColumns: [
            { name: 'role_id' }
        ],
    })
    roles: Roles[];

    // @Column("double")
    // views: number;
    //
    // @Column()
    // age: number;
    //
    // @Column()
    // active: boolean;

    // @OneToOne(type => Photo)
    // @JoinColumn()
    // photo: Photo;



    // @Column("text")
    // description: string;
    //
    // @Column("double")
    // views: number;
}
