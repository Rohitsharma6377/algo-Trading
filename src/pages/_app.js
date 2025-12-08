
import '../styles/globals.css';
import Head from 'next/head';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Suppress MetaMask errors (we're not using crypto features)
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('MetaMask') || args[0]?.includes?.('ethereum')) {
        return; // Suppress MetaMask-related errors
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <>
      <Head>
        <title>AlgoTrader AI - Neural Trading Platform</title>
        <meta name="description" content="Futuristic algorithmic trading platform with AI predictions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
