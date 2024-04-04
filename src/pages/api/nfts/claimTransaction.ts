// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import prisma from "@/utils/prismaClient";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata, TokenStandard, transferV1 } from "@metaplex-foundation/mpl-token-metadata";
import { createTransferInstruction, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import base58, { decode } from "bs58";
import type { NextApiRequest, NextApiResponse } from "next";
import { createSignerFromKeypair, publicKey as mPublicKey, signerIdentity } from "@metaplex-foundation/umi";
import { getToken } from "next-auth/jwt";

type Data = {
  name: string;
};
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string;
const SOLANA_CONNECTION = new Connection(RPC_URL);
const AUTH_SECRET = process.env.NEXTAUTH_SECRET;
const SECRET_KEY = process.env.SECRET_KEY as string;

export const config = {
  maxDuration: 25,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const umi = createUmi(RPC_URL);
  const userWallet = umi.eddsa.createKeypairFromSecretKey(decode(SECRET_KEY));
  const userWalletSigner = createSignerFromKeypair(umi, userWallet);
  umi.use(mplTokenMetadata());
  umi.use(signerIdentity(userWalletSigner));
  if (req.method === 'GET') {
    const token = await getToken({ req, secret: AUTH_SECRET });
    const { tokenId, holderAddress, holderSolanaPublicKey } = req.query
    const seiAddress = holderAddress as string
    const parsedTokenIds: string[] = JSON.parse(tokenId as string);
    const walletPublicKey = new PublicKey(token?.sub as string)
    if(parsedTokenIds.length < 1) {
      throw new Error("You have not selected an NFT to claim") ;
    }
    prisma.$connect();
    const holder = await prisma.holder.findFirst({
      where: { seiAddress }
    })
    console.log(holder?.solAddress, token?.sub);
    console.log(holder?.solAddress === token?.sub);
    try {
      for (let i = 0; i < parsedTokenIds.length; i++) {
        
        const solNft = await prisma.solNft.findFirst({
          where: { tokenId: parsedTokenIds[i] }
        })

        if (solNft) {
          const fetchedNft = await prisma.nft.findFirst({
            where: { id: solNft.seiId as number }
          })
          if((fetchedNft?.ownerId !== holder?.id) || (token?.sub !== holder?.solAddress)) {
            throw new Error("You do not own this NFT")
          }
          const tx = await transferV1(umi, {
            mint: mPublicKey(solNft.tokenAddress),
            authority: userWalletSigner,
            tokenOwner: userWalletSigner.publicKey,
            destinationOwner: mPublicKey(walletPublicKey),
            tokenStandard: TokenStandard.ProgrammableNonFungible,
          }).sendAndConfirm(umi, {
            send: {
              skipPreflight: true,
              maxRetries: 5,
            },
            confirm: {
              strategy: {
                type: 'blockhash',
                ...(await umi.rpc.getLatestBlockhash())
              }
            }
          })
          if (tx) {

            await prisma.nft.update({
              where: { tokenId: solNft.tokenId },
              data: {
                claimed: true,
                claimTx: base58.encode(tx.signature),
              }
            })
          }
          prisma.$disconnect();
          return res.status(200).json({ tx: base58.encode(tx.signature) });
        }

      }
    } catch (e) {
      console.log(e);
      if(e instanceof Error) {
        return res.status(400).json({message: e.message })
      }
      return res.status(400).json({message: "An unknown error occurred" })
    }
  }
}

function isAuthenticatedHolder(holder: string, token: string): boolean {
  return holder === token;
}