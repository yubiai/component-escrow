import dynamic from 'next/dynamic'
import { ChakraProvider, Container, Stack } from '@chakra-ui/react'

import EscrowWidget from '../components/escrow-widget/escrow-widget'
//import Web3Provider from '../utils/web3-provider'
import ProofOfHumanity from '../subgraph/abis/proof-of-humanity.json'
import KlerosLiquid from '../subgraph/abis/kleros-liquid.json'
import TransactionBatcher from '../subgraph/abis/transaction-batcher.json'
import UBI from '../subgraph/abis/ubi.json'
import {
  UBIAddress,
  address,
  klerosLiquidAddress,
  transactionBatcherAddress,
} from '../subgraph/config'

const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet'

const contracts = [
  {
    name: 'proofOfHumanity',
    abi: ProofOfHumanity,
    address: { [network]: address },
  },
  {
    name: 'klerosLiquid',
    abi: KlerosLiquid,
    address: { [network]: klerosLiquidAddress },
  },
  { name: 'UBI', abi: UBI, address: { [network]: UBIAddress } },
  {
    name: 'transactionBatcher',
    abi: TransactionBatcher,
    address: { [network]: transactionBatcherAddress },
  },
]

function App({ Component, pageProps }) {
  const NoSSR = dynamic(
    () => {
      return import('../utils/web3-provider')
    },
    { ssr: false },
  )
  return (
    <ChakraProvider>
      <NoSSR
        infuraURL={process.env.NEXT_PUBLIC_INFURA_ENDPOINT}
        contracts={contracts}
      >
        <Stack minH={'100vh'} direction={{ base: 'column', md: 'row' }}>
          <Container maxW={'8xl'} pt={8} pb={4}>
            <EscrowWidget
              metaEvidence={{
                title: 'Pago con Escrow',
                description:
                  'Camera Nikon 83x optical zoom lens, model x32a 9, additional lens.',
                fileURI: { contract: 'someContractText' },
              }}
              amount={1e16}
              recipient="0x4b93A94ca58594FAF5f64948A26F3E195Eb63B6E"
              timeout={604800}
            />
          </Container>
        </Stack>
      </NoSSR>
    </ChakraProvider>
  )
}

export default App
