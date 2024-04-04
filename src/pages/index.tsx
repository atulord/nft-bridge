import React, { useCallback, useEffect, useState } from 'react';
import { SigninMessage } from "../utils/signInMessage";
import { useWallet, useSigningCosmWasmClient, useCosmWasmClient, WalletConnectButton, useSelectWallet } from '@sei-js/react';
import { useConnection, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import NftList from '../components/NftList';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import base58 from 'bs58';
import { useSession, signOut } from 'next-auth/react';

const TEST_OWNER = "sei188th03te8cp9xja3hkdr2ch4a23tgjeys0xjaq";

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

type Tab = "bridge" | "collect" | "claimed";


function Home() {
  const { connection } = useConnection();
  const { status } = useSession();
  const { openModal } = useSelectWallet();
  const { publicKey, connected, signMessage, connect, disconnect: solanaDisconnet } = useSolanaWallet();
  const { signingCosmWasmClient: signingClient } = useSigningCosmWasmClient();
  const { cosmWasmClient: queryClient } = useCosmWasmClient();
  const [activeTab, setActiveTab] = useState<Tab>('bridge')
  const [nftList, setNftList] = useState([]);
  const [claimableNftList, setClaimableNftList] = useState([]);
  const [claimedNfts, setClaimedNfts] = useState([]);
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string //'sei1qutwpsek4yj24mugfsyr6ypklkavsqx02agefsd8402pckdy4gaqwmhcqd';
  const { connectedWallet, accounts, disconnect } = useWallet();
  const walletModal = useWalletModal();

  const getOwnedNfts = useCallback(async () => {
    if (connectedWallet) {
      const ownedNftsMsg = {
        tokens: {
          owner: accounts[0]?.address,
          limit: 100
        }
      }

      const result = await queryClient?.queryContractSmart(CONTRACT_ADDRESS, ownedNftsMsg);
      return result?.tokens;

    }
  }, [queryClient, connectedWallet, CONTRACT_ADDRESS, accounts])

  const setOwnedNfts = async () => {
    getOwnedNfts().then((data) => {
      if (data) {
        setNftList(data);
      }
    })
  }

  const getClaimableNfts = useCallback(async () => {
    const params = new URLSearchParams({
      holder: accounts[0]?.address,
    })
    return (await fetch(`/api/nfts/claim?${params}`)).json();

  }, [accounts])

  const getClaimedNfts = useCallback(async () => {
    const params = new URLSearchParams({
      holder: accounts[0]?.address,
    })
    return (await fetch(`/api/nfts/claimed?${params}`)).json();

  }, [accounts])

  const setClaimableNfts = async () => {
    getClaimableNfts().then((data) => {
      if (data) {
        setNftList(data)
      }
    })
  }


  useEffect(() => {
    if (connectedWallet) {
      getOwnedNfts().then((data) => {
        if (data) {
          setNftList(data);
        }
      })
    }
  }, [connectedWallet, getOwnedNfts])

  useEffect(() => {
    if (accounts[0]?.address) {
      const holder = { seiAddress: accounts[0]?.address }
      fetch('/api/holder', { method: 'POST', body: JSON.stringify({ holderBlob: holder }) })

    }
  }, [accounts, connectedWallet])

  useEffect(() => {
    if (connected && activeTab === "collect") {
      getClaimableNfts().then((nfts) => {
        setClaimableNftList(nfts.map((nft: { tokenId: string }) => nft.tokenId));
      })
    }
  }, [connected, activeTab, getClaimableNfts])

  useEffect(() => {
    if (connected && activeTab === "claimed") {
      getClaimedNfts().then((nfts) => {
        setClaimedNfts(nfts.map((nft: { tokenId: string }) => nft.tokenId));
      })
    }
  }, [connected, activeTab, getClaimedNfts])

  function SolanaButton() {
    return (
      <button onClick={() => {
        walletModal.setVisible(true);
      }} className='flex justify-center btn bg-indigo-700'>
        <div className="avatar">
          <div className="mr-1 w-4 rounded-full">
            <img src="https://cryptologos.cc/logos/solana-sol-logo.png" />
          </div>
          <span className='text-white'>{"Connect"}</span>
        </div>
      </button>
    )
  }
  function SeiButton() {
    return (
      <button onClick={() => {
        openModal()
      }} className='flex mr-2 justify-center btn bg-orange-600'>
        <div className="avatar">
          <div className="mr-1 w-4 rounded-full">
            <img src="https://blog.sei.io/content/images/2022/08/Sei-logo-only-6.png" />
          </div>
          <span className='text-white'>{"Connect"}</span>
        </div>
      </button>
    )
  }

  function TabView() {
    console.log("tab render");
    if (activeTab === 'bridge') {
      return (
        <div className='flex justify-center'>
          <div className='flex flex-wrap'>
            {nftList && nftList.length === 0 ? <p>No Nfts</p> : <NftList tab={activeTab} nfts={nftList} nftChange={setNftList} />}
          </div>
        </div>
      )
    } else if (activeTab === 'collect') {
      return (
        <div>
          <div className='flex justify-center'>
            <div className='flex flex-wrap'>
              {claimableNftList && claimableNftList.length === 0 ? <p>No Nfts to claim</p> : <NftList tab={activeTab} nfts={claimableNftList} nftChange={setClaimableNftList} />}
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div>
          <div className='flex justify-center'>
            <div className='flex flex-wrap'>
              {claimedNfts && claimedNfts.length === 0 ? <p>You have not claimed any NFTs.</p> : <NftList tab={activeTab} nfts={claimedNfts} nftChange={setClaimableNftList} />}
            </div>
          </div>
        </div>
      )
    }
    // switch(activeTab) {
    //   case 'bridge':
    //     return (
    //       <div className='flex justify-center'>
    //         <div className='flex flex-wrap'>
    //           {nftList && nftList.length === 0 ? <p>No Nfts</p> : <NftList tab={activeTab} nfts={nftList} nftChange={setNftList} />}
    //         </div>
    //       </div>
    //     )
    //   case 'collect':
    //     return (
    //       <div>
    //         <div className='flex justify-center'>
    //           <div className='flex flex-wrap'>
    //             {claimableNftList && claimableNftList.length === 0 ? <p>No Nfts to claim</p> : <NftList tab={activeTab} nfts={claimableNftList} nftChange={setClaimableNftList} />}
    //           </div>
    //         </div>
    //       </div>
    //     )
    //   case 'claimed':
    //     return (
    //       <div>
    //         <div className='flex justify-center'>
    //           <div className='flex flex-wrap'>
    //             {claimedNfts && claimedNfts.length === 0 ? <p>You have not claimed any NFTs.</p> : <NftList tab={activeTab} nfts={claimedNfts} nftChange={setClaimableNftList} />}
    //           </div>
    //         </div>
    //       </div>
    //     )
    // }
  }

  return (

    <div className='w-100 bg-slate-200 dark:bg-zinc-900 h-screen min-h-screen'>
      <Head>
        <title>EACC bridge</title>
      </Head>
      <div className="navbar bg-base-200 ">
        <div className='navbar-start' onClick={async () => {
          await getOwnedNfts();
        }
        }>
          EACC Labs - Bridge
        </div>
        <div className='navbar-center'>
          <img className="w-12" src='https://www.eacclabs.xyz/_next/image?url=%2Fimages%2Feacclabs-logo.png&w=64&q=75'></img>
        </div>
        <div className="navbar-end">
          {connectedWallet ?
            <div className=" mr-2 dropdown dropdown-bottom dropdown-end">
              <div tabIndex={0} role="button" className="flex justify-center btn bg-orange-600">
                <div className="avatar">
                  <div className="mr-1 w-4 rounded-full">
                    <img src="https://blog.sei.io/content/images/2022/08/Sei-logo-only-6.png" />
                  </div>
                  <span className='text-white'>{`${accounts[0]?.address?.slice(0, 6)}...${accounts[0]?.address?.slice(-3)}`}</span>
                </div>
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li className='w-full btn' onClick={disconnect}>Disconnect</li>
              </ul>
            </div>
            :
            <SeiButton />}
          {connected
            ?
            <div className="dropdown dropdown-bottom dropdown-end">
              <button tabIndex={0} role="button" className="flex justify-center btn bg-indigo-700">
                <div className="avatar">
                  <div className="mr-1 w-4 rounded-full">
                    <img src="https://cryptologos.cc/logos/solana-sol-logo.png" />
                  </div>
                  <span className='text-white'>{`${publicKey?.toString().slice(0, 6)}...${publicKey?.toString().slice(-3)}`}</span>
                </div>
              </button>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li className='w-full btn' onClick={async () => {
                  await solanaDisconnet();
                  // await signOut({redirect: false})
                }}>Disconnect</li>
              </ul>
            </div>
            :
            <SolanaButton />
          }
        </div>
      </div>
      {!connectedWallet || !connected ? <p className='text-center mt-4'>Please connect your sei and solana wallets</p> : <div className='mt-6'>
        <div className='flex justify-center'>
          <div role="tablist" className="tabs tabs-boxed w-82">
            <a role="tab" onClick={function () { setActiveTab('bridge') }} className={`tab ${activeTab === 'bridge' ? 'tab-active' : ''}`}>Burn SEI NFTs</a>
            <a role="tab" onClick={function () { setActiveTab('collect') }} className={`tab ${activeTab === 'collect' ? 'tab-active' : ''} `}>Claim SOL NFTs</a>
            <a role="tab" onClick={function () { setActiveTab('claimed') }} className={`tab ${activeTab === 'claimed' ? 'tab-active' : ''} `}>Claimed NFTs</a>
          </div>
        </div>
        {activeTab === 'bridge' ?
          <div className='flex justify-center'>
            <div className='flex flex-wrap'>
              {nftList && nftList.length === 0 ? <p>No Nfts</p> : <NftList tab={activeTab} nfts={nftList} nftChange={setNftList} />}
            </div>
          </div>
          :
          activeTab === 'collect' ?
            <div>
              <div className='flex justify-center'>
                <div className='flex flex-wrap'>
                  {claimableNftList && claimableNftList.length === 0 ? <p>No Nfts to claim</p> : <NftList tab={activeTab} nfts={claimableNftList} nftChange={setClaimableNftList} />}
                </div>
              </div>
            </div>
            :
            activeTab === 'claimed' ?
              <div>
                <div className='flex justify-center'>
                  <div className='flex flex-wrap'>
                    {claimedNfts && claimedNfts.length === 0 ? <p>You have not claimed any NFTs.</p> : <NftList tab={activeTab} nfts={claimedNfts} nftChange={() => {}} />}
                  </div>
                </div>
              </div>
              :
              <></>
        }
      </div>}
    </div>
  );
}

export default Home;
