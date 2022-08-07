import {MigrationInterface, QueryRunner} from 'typeorm';

export class auto1553603040036 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('ALTER TABLE `tree` ADD `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP');
    await queryRunner.query('ALTER TABLE `tree` ADD `updated` datetime NULL ON UPDATE CURRENT_TIMESTAMP');
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `updated`');
    await queryRunner.query('ALTER TABLE `tree` DROP COLUMN `created`');
  }
}
