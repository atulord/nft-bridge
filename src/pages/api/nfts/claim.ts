// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import prisma from "@/utils/prismaClient";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if(req.method === 'GET') {
    const { holder } = req.query
    const address = holder as string;
    prisma.$connect()

    const owner = await prisma.holder.findFirst({
      where: { seiAddress: address }
    })
    console.log("OWNER", owner)
    const nfts = await prisma.nft.findMany({
      where: { ownerId:  owner?.id, burned: true, claimed: false }
    })
    console.log("Burned NFTs",nfts);
    prisma.$disconnect();
    res.status(200).json(nfts);
  }
}
