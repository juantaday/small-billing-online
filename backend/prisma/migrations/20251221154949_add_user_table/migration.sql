-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" VARCHAR(60) NOT NULL,
    "last_name" VARCHAR(60) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "confirmed_email" BOOLEAN NOT NULL DEFAULT false,
    "phone_number" VARCHAR(30),
    "gender" SMALLINT NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "cod_user" VARCHAR(9),
    "address" VARCHAR(255),
    "alias" VARCHAR(50) NOT NULL,
    "url_image" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "people_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cod_user_key" ON "users"("cod_user");

-- CreateIndex
CREATE UNIQUE INDEX "users_people_id_key" ON "users"("people_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_people_id_fkey" FOREIGN KEY ("people_id") REFERENCES "peoples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
