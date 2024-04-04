import { useCallback, useEffect, useState } from "react";
import { NftData } from "../utils/types";
import { useCosmWasmClient, useWallet } from "@sei-js/react";
import { sleep } from "../utils/helpers";


type Tab = "bridge" | "collect" | "claimed";

interface NftDetailProps {
  id: string,
  setSelectedNft: React.Dispatch<React.SetStateAction<NftData>>
  selectedNft: NftData
  hasSelectedAllNfts: boolean
  callType: Tab
}


function NftDetail({ id, setSelectedNft, selectedNft, hasSelectedAllNfts, callType }: NftDetailProps) {
  const { cosmWasmClient: queryClient } = useCosmWasmClient();
  const [nftData, setNftData] = useState<NftData>({})
  const [uri, setUri] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { connectedWallet, accounts } = useWallet();
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string //'sei1qutwpsek4yj24mugfsyr6ypklkavsqx02agefsd8402pckdy4gaqwmhcqd'; //process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  const getNftDetail = useCallback(async () => {
    const nftDetailMsg = {
      nft_info: {
        token_id: id,
      }
    }
    const response = await queryClient?.queryContractSmart(CONTRACT_ADDRESS, nftDetailMsg);
    return response?.token_uri;
  }, [queryClient, CONTRACT_ADDRESS, id]);

  useEffect(() => {
    getNftDetail().then(setUri)
  }, [id, getNftDetail])

  useEffect(() => {
    if (uri) fetch(uri).then(response => response.json()).then(data => setNftData({ id, ...data })).catch((e) => null);
    setIsLoading(false)
  }, [uri, id])

  useEffect(() => {
    if (nftData.name && connectedWallet) {
      fetch('/api/nft', { method: 'POST', body: JSON.stringify({ callType, nftDataBlob: { owner: accounts[0]?.address, ...nftData } }) }).then().catch(e => {
      })
    }
  }, [nftData.name, accounts, nftData ,connectedWallet])

  if (connectedWallet) {
    return (
      <div className="pr-3">
        {
          isLoading ? <p>Loading</p> :
            <div onClick={() => {
              if(callType === "claimed") {
                return;
              }
              if (!hasSelectedAllNfts) {
                setSelectedNft(nftData);
              }
            }} className={`rounded-xl ml-2 mt-2 p-2 w-36 border-2 ${selectedNft.id == id || hasSelectedAllNfts ? "border-indigo-500/75" : "border-white"}`}>
              <div className='ml-1.5 w-28 p-0.5 rounded-xxl'>
                <img src={nftData.image} />
              </div>
              <p className="text-center">{nftData.name}</p>
            </div>
        }
      </div>
    )
  }
  return (null)
}

export default NftDetail;