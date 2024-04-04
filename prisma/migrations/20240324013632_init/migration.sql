-- CreateTable
CREATE TABLE "Nft" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tokenId" VARCHAR(255) NOT NULL,
    "burnTx" VARCHAR(255),
    "claimTx" VARCHAR(255),
    "burned" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "Nft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holder" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seiAddress" VARCHAR(255) NOT NULL,
    "solAddress" VARCHAR(255),

    CONSTRAINT "Holder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolNft" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tokenId" VARCHAR(255) NOT NULL,
    "tokenAddress" VARCHAR(255) NOT NULL,
    "seiId" INTEGER,

    CONSTRAINT "SolNft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nft_tokenId_key" ON "Nft"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Holder_seiAddress_key" ON "Holder"("seiAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Holder_solAddress_key" ON "Holder"("solAddress");

-- CreateIndex
CREATE UNIQUE INDEX "SolNft_tokenId_key" ON "SolNft"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "SolNft_tokenAddress_key" ON "SolNft"("tokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "SolNft_seiId_key" ON "SolNft"("seiId");

-- AddForeignKey
ALTER TABLE "Nft" ADD CONSTRAINT "Nft_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Holder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolNft" ADD CONSTRAINT "SolNft_seiId_fkey" FOREIGN KEY ("seiId") REFERENCES "Nft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
