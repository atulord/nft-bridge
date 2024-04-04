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
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log("token", token);
  if(req.method === 'PUT') {
    prisma.$connect();
    try {
      const { holderBlob } = JSON.parse(req.body);
    const existingHolder = await prisma.holder.findFirst({
      where: { seiAddress: holderBlob.seiAddress}
    })
    if (existingHolder) {
        await prisma.holder.update({
          where: { id: existingHolder.id },
          data: {
            solAddress: token?.sub
          }
        })
    }
    console.log("SOLANA PUBLIC KEY", token?.sub);
    prisma.$disconnect();
    res.status(200).json({});
    } catch(e) {
      prisma.$disconnect();
      console.error(e);
      res.status(401).json("This solana address is already in use")
    }
  } else {
  }
}
