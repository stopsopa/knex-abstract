import {MigrationInterface, QueryRunner} from 'typeorm';

export class auto1553695314909 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('ALTER TABLE `tree` CHANGE `id` `id` int NOT NULL');
    await queryRunner.query('ALTER TABLE `tree` DROP PRIMARY KEY');
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `id`');
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `parent_id`');
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `sort`');
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `l`');
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `r`');
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `level`');
    await queryRunner.query('ALTER TABLE `tree` ADD `tid` int NOT NULL PRIMARY KEY AUTO_INCREMENT');
    await queryRunner.query('ALTER TABLE `tree` ADD `tparent_id` int NULL');
    await queryRunner.query('ALTER TABLE `tree` ADD `tsort` int NULL');
    await queryRunner.query('ALTER TABLE `tree` ADD `tl` int NULL');
    await queryRunner.query('ALTER TABLE `tree` ADD `tr` int NULL');
    await queryRunner.query('ALTER TABLE `tree` ADD `tlevel` int NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      'ALTER TABLE `tree` CHANGE `updated` `updated` datetime(0) NULL ON UPDATE CURRENT_TIMESTAMP'
    );
    await queryRunner.query(
      'ALTER TABLE `tree` CHANGE `created` `created` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP'
    );
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `tlevel`');
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `tr`');
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `tl`');
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `tsort`');
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `tparent_id`');
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `tid`');
    await queryRunner.query('ALTER TABLE `tree` ADD `level` int NULL');
    await queryRunner.query('ALTER TABLE `tree` ADD `r` int NULL');
    await queryRunner.query('ALTER TABLE `tree` ADD `l` int NULL');
    await queryRunner.query('ALTER TABLE `tree` ADD `sort` int NULL');
    await queryRunner.query('ALTER TABLE `tree` ADD `parent_id` int NULL');
    await queryRunner.query('ALTER TABLE `tree` ADD `id` int NOT NULL AUTO_INCREMENT');
    await queryRunner.query('ALTER TABLE `tree` ADD PRIMARY KEY (`id`)');
    await queryRunner.query('ALTER TABLE `tree` CHANGE `id` `id` int NOT NULL AUTO_INCREMENT');
  }
}
