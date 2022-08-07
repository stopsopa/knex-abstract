import {MigrationInterface, QueryRunner} from 'typeorm';

// import debug from '../../CI/debug';

const roles = ['admin', 'user'];

export class auto1545047972476 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    let tmp;

    while ((tmp = roles.shift())) {
      const data = await queryRunner.query(`select count(*) c from roles where name = ?`, [tmp]);

      // debug(data[0].c)

      if (data && data[0] && data[0].c == 0) {
        await queryRunner.query(`insert into roles (name) values (?)`, [tmp]);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    let tmp;

    while ((tmp = roles.shift())) {
      await queryRunner.query(`delete from roles where name = ?`, [tmp]);
    }
  }
}
