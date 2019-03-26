import {MigrationInterface, QueryRunner} from "typeorm";

export class auto1553253474858 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `tree` (`id` int NOT NULL AUTO_INCREMENT, `parent_id` int NULL, `sort` int NULL, `l` int NULL, `r` int NULL, `level` int NULL, `title` varchar(50) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `roles` CHANGE `created` `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP");
        await queryRunner.query("ALTER TABLE `roles` CHANGE `updated` `updated` datetime NULL ON UPDATE CURRENT_TIMESTAMP");
        await queryRunner.query("ALTER TABLE `users` CHANGE `enabled` `enabled` tinyint(1) NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `users` CHANGE `created` `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP");
        await queryRunner.query("ALTER TABLE `users` CHANGE `updated` `updated` datetime NULL ON UPDATE CURRENT_TIMESTAMP");
        await queryRunner.query("ALTER TABLE `users` CHANGE `config` `config` mediumtext NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `users` CHANGE `config` `config` mediumtext NULL");
        await queryRunner.query("ALTER TABLE `users` CHANGE `updated` `updated` datetime(0) NULL ON UPDATE CURRENT_TIMESTAMP");
        await queryRunner.query("ALTER TABLE `users` CHANGE `created` `created` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP");
        await queryRunner.query("ALTER TABLE `users` CHANGE `enabled` `enabled` tinyint(1) NOT NULL DEFAULT '0'");
        await queryRunner.query("ALTER TABLE `roles` CHANGE `updated` `updated` datetime(0) NULL ON UPDATE CURRENT_TIMESTAMP");
        await queryRunner.query("ALTER TABLE `roles` CHANGE `created` `created` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP");
        await queryRunner.query("DROP TABLE `tree`");
    }

}
