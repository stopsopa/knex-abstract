import {MigrationInterface, QueryRunner} from "typeorm";

export class auto1544315845138 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `many` ADD `user_id` int NULL");
        await queryRunner.query("ALTER TABLE `many` ADD CONSTRAINT `FK_c38f48340b7b2f067d02bb36dcb` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)");
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `many` DROP FOREIGN KEY `FK_c38f48340b7b2f067d02bb36dcb`");
        await queryRunner.query("ALTER TABLE `many` DROP COLUMN `user_id`");
    }

}
