import { useEffect, useState } from "react";
import { NftData } from "../utils/types";
import { useSigningCosmWasmClient, useWallet, useCosmWasmClient, useStargateClient, } from "@sei-js/react";
import { useConnection, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import NftDetail from "./NftDetail";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import base58 from "bs58";
import { Id, toast } from 'react-toastify';
import { calculateFee } from "@cosmjs/stargate";
import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import { SigninMessage } from "@/utils/signInMessage";
import { createTransferInstruction } from "@solana/spl-token";
require("@solana/wallet-adapter-react-ui/styles.css");

type Tab = "bridge" | "collect" | "claimed";

function NftList({ nfts, tab, nftChange }: { nfts: any[], tab: Tab, nftChange: any }) {
  const { stargateClient } = useStargateClient()
  const { cosmWasmClient: queryClient } = useCosmWasmClient();
  const { data: session, status } = useSession();
  const { connection } = useConnection();
  const { publicKey, connected, signMessage, sendTransaction, signTransaction,disconnect: solanaDisconnet, wallet } = useSolanaWallet();
  const [selectedNft, setSelectedNft] = useState<NftData>({})
  const { signingCosmWasmClient: signingClient } = useSigningCosmWasmClient();
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [hasSelectedAllNfts, setHasSelectedAllNfts] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showErrorNotification, setShowErrorNotification] = useState<boolean>(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState<boolean>(false)
  const { connectedWallet, accounts, disconnect } = useWallet();
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS //'sei1qutwpsek4yj24mugfsyr6ypklkavsqx02agefsd8402pckdy4gaqwmhcqd';
  const BURN_ADDRESS = 'sei1v3k67nn0te697wlxfq3txmcfselr2thpaeed3f' //'sei1947trmsyuf43e5xun9uel9pw84qnewq9n54rep';
  const walletModal = useWalletModal();
  const [changeableNfts, setChangeableNfts] = useState(nfts)

  const nftItems = nfts.map((nft, index) => {
    return (
      <NftDetail callType={tab} id={nft} key={nft} hasSelectedAllNfts={hasSelectedAllNfts} setSelectedNft={setSelectedNft} selectedNft={selectedNft} />
    )
  })

  const Msg = ({ title, text }: { title: string, text: string }) => {
    return (
      <div className="msg-container">
        <p className="msg-title">{title}</p>
        <br />
        <p className="msg-description">{text}</p>
      </div>
    );
  };

  const toaster = (myProps: any, toastProps: any): Id =>
    toast(<Msg {...myProps} />, { ...toastProps });

  toaster.success = (myProps: any, toastProps: any): Id =>
    toast.success(<Msg {...myProps} />, { ...toastProps });

  const claimAllNfts = async () => {
    const nftsCopy = nfts;
    const removedNfts = []
    try {
      for (let i = 0; i < nftsCopy.length; i++) {
        await claimNft(nftsCopy[i])
      }
      nftChange([]);

    } catch(e) {
      setIsClaiming(false);
      setHasSelectedAllNfts(false);
      throw new Error("issue with claiming all NFTS")
    }
  }

  const takePayment = async(numNfts: number) => {
    try {
      if(publicKey && signTransaction) {
        const pk = publicKey ? publicKey.toString() : ""
        const transaction = new Transaction().add(SystemProgram.transfer({
          fromPubkey: new PublicKey(pk),
          toPubkey: new PublicKey('HXzQxX8pXGwMNmX6PFYGkFgNACj4cSXSzgB5QTZE4yjV'),
          lamports: numNfts * (0.01 * LAMPORTS_PER_SOL),
        }))
        const latestBlockhash = await connection.getLatestBlockhash()
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = publicKey;
        const signedTransation = await signTransaction(transaction);
        const result = await sendTransaction(signedTransation, connection)
        return result;
      }
    } catch(e) {
      if (e instanceof Error) {
        toast.error(e.message);
        throw e;
      } else {
        toast.error("We could not take payment")
        throw new Error("We could not take payment");
      }
    }
  }


  const claimNft = async (nftId: string) => {
    const params = new URLSearchParams({
      tokenId: JSON.stringify([nftId]),
      holderSolanaPublicKey: String(publicKey?.toString()),
      holderAddress: accounts[0]?.address,
    })
    try {
     
      if (!publicKey) {
        throw new Error("Connect your solana wallet")
      }
      const trxResponse = await (await fetch(`/api/nfts/claimTransaction?${params}`)).json().catch((e) => {
        toast.error(e);
      });
      toast.success("NFT has been successfully claimed");
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message);
      } else {
        toast.error("An unknown error occurred");
      }
      throw new Error("we encountered a problem claiming your NFT");
    }
  }
  const signTransferWithConnectedWallet = async () => {
    toast.info("Claiming is in progress. Please do not leave the page");
    if (!hasSelectedAllNfts && selectedNft.id == null) {
      return toast.error("Please select an NFT to claim");
    }
    setIsClaiming(true);
    try {
      if (hasSelectedAllNfts) {
        await takePayment(nfts.length);
        await claimAllNfts();
      } else {
        await takePayment(1);
        await claimNft(String(selectedNft.id));
        const changedNfts = nfts.filter((nft) => {
          return nft !== selectedNft.id
        })
        nftChange(changedNfts);
      }
      setSelectedNft({});
      setIsClaiming(false);
      setHasSelectedAllNfts(false);
    }catch(e) {
      console.log("SHOW Error",e)
      setIsClaiming(false);
      setSelectedNft({});
    }

  }
  const handleSignIn = async () => {
    try {
      if (!connected) {
        walletModal.setVisible(true);
      }

      const csrf = await getCsrfToken();
      if (!publicKey || !csrf || !signMessage) return;

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: publicKey?.toBase58(),
        statement: `Sign into e/acc bridge`,
        nonce: csrf,
      });

      const data = new TextEncoder().encode(message.prepare());
      const signature = await signMessage(data);
      const serializedSignature = base58.encode(signature);

      await signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        signature: serializedSignature,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message)
      }
    }
  };

  const toggleErrorNotification = () => {
    setShowErrorNotification((prev) => !prev);
  };
  const showError = () => {
    setShowErrorNotification(true);
    setTimeout(() => {
      toggleErrorNotification();
    }, 1000);
  };

  const toggleSuccessNotification = () => {
    setShowSuccessNotification((prev) => !prev);
  };
  const showSuccess = () => {
    setShowErrorNotification(true);
    setTimeout(() => {
      toggleSuccessNotification();
    }, 1000);
  };

  useEffect(() => {
    const pk = (session as any)?.publicKey;
    if (pk !== publicKey?.toString()) {
      if (connected) {
        setIsAuthenticating(true)
        handleSignIn().then((data) => {
          const holder = { seiAddress: accounts[0]?.address, solAddress: publicKey?.toString() }
          fetch('/api/holder/solana', { method: 'PUT', body: JSON.stringify({ holderBlob: holder }) }).then(() => {
            setIsAuthenticating(false)
          }).catch((e: any) => {
            toast.error(e.message);
          })

        }).catch((e) => {
          toast.error(e.message)
          setIsAuthenticating(false)
        })
      }
    }
  }, [connected, publicKey])

  const burnNft = async () => {
    if (!connectedWallet || !signingClient) {
      toast.error('Wallet is not connected')
      return;
    }

    setIsBurning(true);
    const nftsToBurn = hasSelectedAllNfts ? nfts : [selectedNft.id]
    try {
      const senderAddress = accounts[0].address;

      // Define the message to transfer the NFT to the burn address
      const msgs = []
      const fee = hasSelectedAllNfts ? calculateFee(2000000, "0.1usei") : calculateFee(600000, "0.1usei");

      if (hasSelectedAllNfts) {
        nftsToBurn.forEach((nft) => {
          msgs.push({
            contractAddress: CONTRACT_ADDRESS as string,
            msg: {
              transfer_nft: {
                recipient: BURN_ADDRESS,
                token_id: nft
              }
            }
          })
        })
      } else {
        msgs.push(
          {
            contractAddress: CONTRACT_ADDRESS as string,
            msg: {
              transfer_nft: {
                recipient: BURN_ADDRESS,
                token_id: selectedNft.id,
              },
            }
          })
      }
      // Send the transaction
      const result = await signingClient?.executeMultiple(senderAddress, msgs, fee);
      await fetch('/api/nfts/burn', { method: 'POST', body: JSON.stringify({ nfts: nftsToBurn as string[], burnTx: result.transactionHash }) })
      setIsBurning(false);
      const toastMessage = hasSelectedAllNfts ? "All Nfts have been successfully bridged." : `${selectedNft.name} has been successfully bridged.`;
      toaster.success(
        {
          title: toastMessage,
          text: `click the "claim" tab to collect your e/acc on Solana!`,
        },
        {}
      );
      if (hasSelectedAllNfts) {
        nftChange([]);
      } else {
        const newNftList = nfts.filter((nft) => {
          return nft !== selectedNft.id;
        })
        nftChange(newNftList);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
      setIsBurning(false);
    }
  };
  if (tab === 'bridge') {
    return (
      <div>
        <div className='flex flex-wrap justify-center'>
          {nftItems}
        </div>
        <div className="flex flex-wrap justify-center mt-10">
          <button className={`btn btn-info mr-5 dark:bg-slate-300 dark:text-zinc-950 dark:hover:bg-slate-100} ${isBurning ? "disabled:text-white dark:disabled:bg-slate-400" : ""}`} disabled={(selectedNft.id === undefined && !hasSelectedAllNfts) || isBurning} onClick={async () => {
            await burnNft();
          }}>{isBurning ? 'Burning' : hasSelectedAllNfts ? 'Burn all e/acc Nfts' : selectedNft.name ? `Burn ${selectedNft.name}` : `Select an Nft`}
            {isBurning ? <span className="loading loading-spinner loading-sm" /> : <></>}

          </button>
          <div className="flex flex-column ml-5">
            <input type="checkbox" disabled={isBurning} checked={hasSelectedAllNfts} onChange={() => {
              setSelectedNft({});
              setHasSelectedAllNfts(!hasSelectedAllNfts);
            }} className="checkbox checkbox-primary mt-3" /><p className="mt-4 ml-2 label-text dark:text-white">Select all Nfts</p>
          </div>
        </div>
      </div>

    );
  }
  if (tab === "claimed") {
    return (
      <div className="justify-center">
        <div className="flex flex-wrap">
          {nftItems}
        </div>
      </div>
    )
  } else {
    return (
      <div>
        <div className="flex flex-wrap justify-center">
          {nftItems}
        </div>
        <div className="flex flex-wrap justify-center mt-10">
          <button disabled={(isClaiming || (selectedNft.id === undefined && !hasSelectedAllNfts))} className={` dark:bg-slate-300 dark:text-zinc-950 dark:hover:bg-slate-100 btn ${isClaiming ? "disabled:text-white dark:disabled:bg-slate-400" : ""}`} onClick={async () => {
            await signTransferWithConnectedWallet();
          }}> {isClaiming ? <span>Claiming<span className="loading loading-spinner loading-sm ml-3" /> </span> : (hasSelectedAllNfts || selectedNft.id !== undefined) ? <span>Claim NFT</span> : <span>Select an NFT</span>}</button>
          <div className="ml-5 flex flex-column">
            <input type="checkbox" disabled={isClaiming} checked={hasSelectedAllNfts} onChange={() => {
              setSelectedNft({});
              setHasSelectedAllNfts(!hasSelectedAllNfts);
            }} className="checkbox checkbox-primary mt-3" /><p className="mt-4 ml-2 label-text dark:text-white">Select all Nfts</p>
          </div>
        </div>
      </div>
    )
  }
}

export default NftList;