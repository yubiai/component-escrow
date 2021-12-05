import React from "react";
import WalletConnectWeb3Provider from "@walletconnect/web3-provider";
import Authereum from "authereum";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import Web3 from "web3";
import Web3Modal from "web3modal";

const deriveAccount = async function (message, create = true) {
  const [account] = await this.eth.getAccounts();
  const storageKey = `${account}-${message}`;

  let secret = localStorage.getItem(storageKey);
  if (secret === null) {
    if (!create) return secret;
    secret = await this.eth.personal.sign(message, account);
    localStorage.setItem(storageKey, secret);
  }

  return this.eth.accounts.privateKeyToAccount(this.utils.keccak256(secret));
};

export const createWeb3 = (infuraURL) => {
  const web3 = new Web3(infuraURL);
  console.log("fernando infura >>> ", process.env.NEXT_PUBLIC_INFURA_ENDPOINT)
  web3.modal = new Web3Modal({
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectWeb3Provider,
        options: {
          infuraId: "777dea866eb241a6818b154b7b637e66",
        },
      },
      authereum: {
        package: Authereum,
      },
    },
  });
  web3.infuraURL = infuraURL;
  web3.deriveAccount = deriveAccount;
  return web3;
};
export const createWeb3FromModal = async (modal, infuraURL) => {
  const web3 = new Web3(await modal.connect());
  web3.modal = modal;
  web3.infuraURL = infuraURL;
  web3.deriveAccount = deriveAccount;
  return web3;
};

const Context = createContext();

export default function Web3Provider({
  infuraURL,
  contracts,
  onNetworkChange,
  children,
}) {
  const [web3, setWeb3] = useState(() => createWeb3(infuraURL));

  useEffect(() => {
    if (infuraURL !== web3.infuraURL) setWeb3(createWeb3(infuraURL));
  }, [infuraURL, web3.infuraURL]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (web3.modal.cachedProvider) {
        const _web3 = await createWeb3FromModal(web3.modal, web3.infuraURL);
        if (!cancelled) setWeb3(_web3);
      }
    })();

    if (window.ethereum) {
      const listener = async () => {
        setWeb3(await createWeb3FromModal(web3.modal, web3.infuraURL));
      };
      window.ethereum.on("accountsChanged", listener);
      return () => {
        cancelled = true;
        window.ethereum.removeListener("accountsChanged", listener);
      };
    }
    return () => (cancelled = true);
  }, [web3.modal, web3.infuraURL]);

  // Instantiate contracts.
  useEffect(() => {
    let cancelled = false;
    const networkIdToName = {
      1: "mainnet",
      42: "kovan",
    };
    (async () => {
      const ETHNetID = await web3.eth.net.getId();
      if (!cancelled && ETHNetID !== web3.ETHNet?.ID) {
        web3.ETHNet = {
          ID: ETHNetID,
          name: { 42: "kovan", 1: "mainnet" }[ETHNetID],
        };
        setWeb3({ ...web3 });
        if (onNetworkChange) onNetworkChange(web3.ETHNet);
      }

      if (networkIdToName[ETHNetID] !== process.env.REACT_APP_NEXT_PUBLIC_NETWORK) return;

      if (contracts !== web3._contracts) {
        const [account] = await web3.eth.getAccounts();
        if (!cancelled) {
          web3.contracts = contracts.reduce(
            (acc, { name, abi, address, options }) => {
              acc[name] = new web3.eth.Contract(
                abi,
                address[web3.ETHNet.name],
                {
                  from: account,
                  ...options,
                }
              );
              acc[name].jsonInterfaceMap = acc[name]._jsonInterface.reduce(
                (_acc, method) => {
                  _acc[method.name] = method;
                  return _acc;
                },
                {}
              );
              return acc;
            },
            {}
          );
          web3._contracts = contracts;
          setWeb3({ ...web3 });
        }
      }
    })();
    return () => (cancelled = true);
  }, [web3, onNetworkChange, contracts]);
  return (
    <Context.Provider
      value={useMemo(
        () => ({
          web3,
          setWeb3,
          async connect() {
            web3.modal.clearCachedProvider();
            setWeb3(await createWeb3FromModal(web3.modal, web3.infuraURL));
          },
        }),
        [web3, setWeb3]
      )}
    >
      {children}
    </Context.Provider>
  );
}
