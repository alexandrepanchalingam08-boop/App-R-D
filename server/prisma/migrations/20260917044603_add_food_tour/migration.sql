-- CreateTable
CREATE TABLE "FoodTour" (
    "id" TEXT NOT NULL,
    "lieu" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "FoodTour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enseigne" (
    "id" TEXT NOT NULL,
    "foodTourId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyLearnings" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enseigne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnseignePhoto" (
    "id" TEXT NOT NULL,
    "enseigneId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnseignePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "enseigneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "comment" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPhoto" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FoodTour" ADD CONSTRAINT "FoodTour_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enseigne" ADD CONSTRAINT "Enseigne_foodTourId_fkey" FOREIGN KEY ("foodTourId") REFERENCES "FoodTour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnseignePhoto" ADD CONSTRAINT "EnseignePhoto_enseigneId_fkey" FOREIGN KEY ("enseigneId") REFERENCES "Enseigne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_enseigneId_fkey" FOREIGN KEY ("enseigneId") REFERENCES "Enseigne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPhoto" ADD CONSTRAINT "ProductPhoto_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
