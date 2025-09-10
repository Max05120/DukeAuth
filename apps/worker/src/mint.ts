import { createPublicClient, createWalletClient, http, encodeFunctionData } from 'viem';
import { Env } from '@dukeauth/core';
import { privateKeyToAccount } from 'viem/accounts';
import { withTenant, prisma } from '@dukeauth/db';

type MintPayload = { nftId: string; organizationId: string };

const ERC721_ABI = [
  {
    type: 'function',
    name: 'safeMint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'uri', type: 'string' },
    ],
    outputs: [],
  },
];

export async function handleMint(payload: MintPayload) {
  const rpc = Env.POLYGON_RPC_URL();
  const pk = Env.MINTER_PRIVATE_KEY();
  const contract = process.env.NFT_CONTRACT_ADDRESS || '';
  if (!rpc || !pk || !contract) {
    console.warn('Mint config missing; skipping mint');
    return;
  }

  // Load NFT metadata for recipient and tokenURI
  const nft = await withTenant(payload.organizationId, (tx) => tx.nft.findUnique({ where: { id: payload.nftId } }));
  if (!nft) return;
  const to = (nft.metadata as any)?.to as string | undefined;
  const uri = (nft.metadata as any)?.tokenURI as string | undefined;
  if (!to || !uri) {
    console.warn('NFT metadata missing to/tokenURI');
    return;
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  const publicClient = createPublicClient({ transport: http(rpc) });
  const walletClient = createWalletClient({ account, transport: http(rpc) });
  const chainId = await publicClient.getChainId();

  const data = encodeFunctionData({ abi: ERC721_ABI as any, functionName: 'safeMint', args: [to as `0x${string}`, uri] });
  const txHash = await walletClient.sendTransaction({ to: contract as `0x${string}`, data, chain: undefined });

  // Store tx hash in NFT metadata
  const nextMeta = { ...(nft.metadata as any), txHash };
  await withTenant(payload.organizationId, (tx) => tx.nft.update({ where: { id: nft.id }, data: { metadata: nextMeta } }));
}
