import {MigrationInterface, QueryRunner} from 'typeorm';

// import debug from '../../CI/debug';

const roles = ['admin', 'user'];

export class auto1624999697549 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    let tmp;

    while ((tmp = roles.shift())) {
      const data = await queryRunner.query(`SELECT COUNT(*) c FROM roles WHERE name = $1`, [tmp]);

      // debug(data[0].c)

      if (data && data[0] && data[0].c == 0) {
        await queryRunner.query(`insert into roles (name) values ($1)`, [tmp]);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    let tmp;

    while ((tmp = roles.shift())) {
      await queryRunner.query(`delete from roles where name = $1`, [tmp]);
    }
  }
}
