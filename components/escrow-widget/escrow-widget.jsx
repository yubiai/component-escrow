import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Button, Text, Link, Heading } from '@chakra-ui/react'
import Web3 from 'web3'
import KlerosEscrow from '../../utils/kleros-escrow'

const defaultWeb3 = new Web3(process.env.NEXT_PUBLIC_INFURA_ENDPOINT)

export default function EscrowWidget({
  web3,
  court,
  currency,
  metaEvidence,
  children,
  amount,
  ticker = 'ETH',
  recipient,
  timeout,
  onOpen,
  onClose,
}) {
  if (!web3) web3 = defaultWeb3

  const klerosEscrowRef = useRef(new KlerosEscrow(web3))
  console.log('fernando current >>>> ', klerosEscrowRef)
  useEffect(() => {
    klerosEscrowRef.current.setCourtAndCurrency(court, currency)
  }, [court, currency])

  const [metaEvidenceFileURI, setMetaEvidenceFileURI] = useState(
    metaEvidence.fileURI,
  )
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (metaEvidence.file) {
        const _metaEvidenceFileURI = `${
          klerosEscrowRef.current.archon.arbitrable.ipfsGateway
        }${await klerosEscrowRef.current.upload(
          'metaEvidenceFile',
          metaEvidence.file,
        )}`
        if (!cancelled) setMetaEvidenceFileURI(_metaEvidenceFileURI)
      } else if (metaEvidence.fileURI !== metaEvidenceFileURI)
        setMetaEvidenceFileURI(metaEvidence.fileURI)
    })()
    return () => (cancelled = true)
  }, [metaEvidence, metaEvidenceFileURI])

  const loadingRef = useRef(false)
  const [loading, setLoading] = useState(false)
  return (
    <Box direction="row" align="center">
      <Heading textAlign="center" pb={6}>
        {metaEvidence.title}
      </Heading>
      <Heading fontWeight="400" size="md" textAlign="center" pb={4}>
        {metaEvidence.description}
      </Heading>
      <Text>
        Precio: {web3.utils.fromWei(String(amount))} {ticker}
      </Text>
      <Link href={metaEvidenceFileURI}>
        Contract
      </Link>
      <Flex sx={{ justifyContent: 'space-between' }} pt={10}>
        <Button
          // variant="secondary"
          // sx={{ width: 80 }}
          onClick={() => close()}
        >
          Regresar
        </Button>
        <Link
          sx={{ alignItems: 'center', display: 'flex' }}
          href="https://kleros.io"
        >
          <p>Por Yubiai y Kleros</p>
        </Link>
        <Button
          colorScheme="blue"
          //loading={loading}
          onClick={() => {
            loadingRef.current = true
            setLoading(true)
            klerosEscrowRef.current
              .createTransaction(amount, recipient, timeout, metaEvidence)
              .then(() => {
                close()
                loadingRef.current = false
                setLoading(false)
              })
              .catch(() => {
                loadingRef.current = false
                setLoading(false)
                close()
              })
          }}
        >
          Pagar
        </Button>
      </Flex>
    </Box>
  )
}
