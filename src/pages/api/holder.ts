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
  if(req.method === 'POST') {
    const { holderBlob } = JSON.parse(req.body);
    prisma.$connect();
    const existingHolder = await prisma.holder.findFirst({
      where: { seiAddress: holderBlob.seiAddress}
    })
    if (existingHolder === null || undefined) {
      const holder = await prisma.holder.create({
        data: {
          seiAddress: holderBlob.seiAddress
        }
      })
    }
    prisma.$disconnect();
    res.status(200).json({});
  }
}
