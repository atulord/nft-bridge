import "@/styles/globals.css";
import { SeiWalletProvider } from '@sei-js/react';
import { SessionProvider } from "next-auth/react";
import React, { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { UnsafeBurnerWalletAdapter, PhantomWalletAdapter, SolflareWalletAdapter,  } from '@solana/wallet-adapter-wallets';
import {
	WalletModalProvider,
	WalletDisconnectButton,
	WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { clusterApiUrl } from '@solana/web3.js';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  const chainId = process.env.NEXT_PUBLIC_SOL_NETWORK  == "devnet" ? "devnet" : "mainnet";
  const network = process.env.NEXT_PUBLIC_SOL_NETWORK == "devnet" ? WalletAdapterNetwork.Devnet : WalletAdapterNetwork.Mainnet;
	// You can also provide a custom RPC endpoint.
	const endpoint = useMemo(() => clusterApiUrl(network), [network]);
	const wallets = useMemo(
		() => [new SolflareWalletAdapter()],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[network]
	);
  const SeiConfiguration = {
    devnet: {
      chainId: 'atlantic-2',
      restUrl: 'https://rest.wallet.atlantic-2.sei.io',
      rpcUrl: 'https://rpc.wallet.atlantic-2.sei.io',
    },
    mainnet: {
      chainId: 'pacific-1',
      rpcUrl: 'https://sei-rpc.polkachu.com',
      restUrl: 'https://sei-api.polkachu.com'
    }
  }
  // return <Component {...pageProps} />;
  return (
    <ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={wallets} autoConnect>
				<WalletModalProvider>
					{/* <WalletDisconnectButton /> */}
					<SeiWalletProvider
						chainConfiguration={SeiConfiguration[chainId]}
						wallets={['compass', 'fin', 'leap']}>
              <ToastContainer />
              <SessionProvider session={pageProps.session} refetchInterval={0}>
              <Component {...pageProps} />
              </SessionProvider>
					</SeiWalletProvider>
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
  )
}
