import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import NftList from "./NftList";
import { useState } from 'react';
import { getServerSession } from 'next-auth';
import { getToken } from "next-auth/jwt";
import { getSession } from 'next-auth/react';



export const getServerSideProps: GetServerSideProps = (async(ctx) => {
   let session = getSession(ctx);
   console.log('HELLO');
  // const params = new URLSearchParams({
  //   holder: accounts[0]?.address,
  // })
  // return (await fetch(`/api/nfts/claim?${params}`)).json();
  return {props: {session }}
})
function BurnableNFTsTab({ session }: InferGetServerSidePropsType<typeof getServerSideProps>)  {
  const [nfts, setNfts] = useState([]);
  console.log(session);
  return(
    <div className='flex justify-center'>
            <div className='flex flex-wrap'>
              {nfts && nfts.length === 0 ? <p>No Nfts</p> : <NftList tab='bridge' nfts={nfts} nftChange={setNfts} />}
            </div>
          </div>
  )
}

export default BurnableNFTsTab;