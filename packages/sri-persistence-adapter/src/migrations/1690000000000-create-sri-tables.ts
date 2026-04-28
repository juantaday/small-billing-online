import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSriTables1690000000000 implements MigrationInterface {
  name = 'CreateSriTables1690000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS electronic_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        access_key varchar(49) UNIQUE NOT NULL,
        voucher_type varchar(2) NOT NULL,
        status varchar(32) NOT NULL,
        environment varchar(1) NOT NULL,
        emission_type varchar(1) NOT NULL,
        issuer_ruc varchar(13) NOT NULL,
        recipient_id varchar(20) NOT NULL,
        issued_at timestamp NOT NULL,
        xml_generated_at timestamp,
        signed_at timestamp,
        sent_at timestamp,
        received_at timestamp,
        authorized_at timestamp,
        rejected_at timestamp,
        error_reason varchar(500),
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS transmission_attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id uuid NOT NULL REFERENCES electronic_documents(id) ON DELETE CASCADE,
        status varchar(32) NOT NULL,
        attempt_number int NOT NULL,
        request_payload text,
        response_payload text,
        error_message text,
        started_at timestamp NOT NULL,
        finished_at timestamp
      );

      CREATE TABLE IF NOT EXISTS sri_authorizations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id uuid NOT NULL REFERENCES electronic_documents(id) ON DELETE CASCADE,
        authorization_number varchar(64) NOT NULL,
        authorization_date timestamp NOT NULL,
        authorized_xml text NOT NULL,
        created_at timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS document_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id uuid NOT NULL REFERENCES electronic_documents(id) ON DELETE CASCADE,
        status varchar(32) NOT NULL,
        reason varchar(500),
        created_at timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS file_artifacts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id uuid NOT NULL REFERENCES electronic_documents(id) ON DELETE CASCADE,
        type varchar(32) NOT NULL,
        path varchar(500) NOT NULL,
        created_at timestamp DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS file_artifacts;
      DROP TABLE IF EXISTS document_events;
      DROP TABLE IF EXISTS sri_authorizations;
      DROP TABLE IF EXISTS transmission_attempts;
      DROP TABLE IF EXISTS electronic_documents;
    `);
  }
}
