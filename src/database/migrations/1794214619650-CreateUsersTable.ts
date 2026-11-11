import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1794214619650 implements MigrationInterface {
    name = 'CreateUsersTable1794214619650'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`username\` varchar(50) NOT NULL, \`password\` varchar(255) NOT NULL, \`bio\` text NULL, \`image\` varchar(500) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_users_email\` (\`email\`), UNIQUE INDEX \`IDX_users_username\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_users_username\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_users_email\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
