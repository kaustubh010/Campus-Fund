import { AlgorandClient } from '@algorandfoundation/algokit-utils'

export const algorand = AlgorandClient.fromConfig({
  algodConfig: {
    server: process.env.NEXT_PUBLIC_ALGOD_SERVER ?? 'http://127.0.0.1',
    port: Number(process.env.NEXT_PUBLIC_ALGOD_PORT ?? 4001),
    token: process.env.NEXT_PUBLIC_ALGOD_TOKEN ?? '',
  },
})

export const SAVINGS_APP_ID = BigInt(process.env.NEXT_PUBLIC_APP_ID ?? '0')