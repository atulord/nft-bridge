// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import prisma from "@/utils/prismaClient";
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if(req.method === 'POST') {
    const { burnTx, nfts } = JSON.parse(req.body);
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log("token", token);
    prisma.$connect();

    const nftsFromDb = await prisma.nft.updateMany({
      where: {
        tokenId: {
          in: nfts
        },
        burned: false,
      } ,
      data: {
        burned: true,
        burnTx,
      }
    })
    prisma.$disconnect();
    console.log(nftsFromDb);
    res.status(200).json(nftsFromDb)
  }

  if(req.method === 'GET') {
    const { holder } = req.query
    const address = holder as string;
    prisma.$connect()

    const owner = await prisma.holder.findFirst({
      where: { seiAddress: address }
    })
    const nfts = await prisma.nft.findMany({
      where: { ownerId:  owner?.id, burned: true }
    })
    console.log(nfts)
    prisma.$disconnect();
    res.status(200).json(nfts);
  }
}
