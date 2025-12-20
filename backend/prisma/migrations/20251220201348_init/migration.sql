-- CreateTable
CREATE TABLE "peoples" (
    "id" TEXT NOT NULL,
    "first_name" VARCHAR(60) NOT NULL,
    "last_name" VARCHAR(60),
    "ruc_ci" VARCHAR(13) NOT NULL,
    "birth_date" DATE,
    "main_email" VARCHAR(100),
    "phone" VARCHAR(30),
    "address" VARCHAR(255),
    "person_type" SMALLINT NOT NULL,
    "identity_type" SMALLINT NOT NULL,
    "date_registered" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peoples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "peoples_ruc_ci_key" ON "peoples"("ruc_ci");

-- CreateIndex
CREATE UNIQUE INDEX "peoples_main_email_key" ON "peoples"("main_email");
