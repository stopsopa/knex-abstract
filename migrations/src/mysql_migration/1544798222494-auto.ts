import {MigrationInterface, QueryRunner} from 'typeorm';

export class auto1544798222494 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('ALTER TABLE `users` ADD `config` mediumtext NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `config`');
  }
}
