// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import prisma from "@/utils/prismaClient";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if(req.method === 'POST') {

    prisma.$connect();
    try {
      const { nftDataBlob, callType } = JSON.parse(req.body);
      const existingNft = await prisma.nft.findFirst({
        where: { tokenId: nftDataBlob.id}
      })
      const owner = await prisma.holder.findFirst({
        where: { seiAddress: nftDataBlob.owner}
      })
       if (!existingNft) {
        if(owner){
          const nft = await prisma.nft.create({
            data: {
              tokenId: nftDataBlob.id,
              ownerId: owner.id,
              data: nftDataBlob,
            }
          })
          const solNft =  await prisma.solNft.findFirst({
            where: { tokenId: nft.tokenId },
          })
          if(solNft) {
            await prisma.solNft.update({
              where: {tokenId: nft.tokenId},
              data: {
                seiId: nft.id
              }
            })
          }
  
        }
      } else {
        if(owner) {
          console.log("OWNER", owner);
          if(callType === "bridge") {
            const nft = await prisma.nft.update({
              where: { tokenId: existingNft.tokenId },
              data: {
                ownerId: owner.id,
              }
            })
          }
  
          const nft =  await prisma.nft.findFirst({
            where: { tokenId: existingNft.tokenId }
          })
          const solNft =  await prisma.solNft.findFirst({
            where: { tokenId: nft?.tokenId },
          })
          if(solNft) {
            await prisma.solNft.update({
              where: {tokenId: nft?.tokenId},
              data: {
                seiId: nft?.id
              }
            })
          }
  
        }
      }
      prisma.$disconnect();
      res.status(200).json({});

    } catch(e) {
      prisma.$disconnect();
      console.error(e);
      res.status(400).json({error: e})
    }
  } else {
    // const holders = await prisma.holder.findMany({});
    // console.log(holders);
    // res.status(200).json(holders);
  }
}
