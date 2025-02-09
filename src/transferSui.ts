import { t, type Context } from "elysia"

import { SuiClient, type CoinStruct } from '@mysten/sui/client';
import { Transaction, type ObjectRef } from "@mysten/sui/transactions";
import { isValidSuiAddress } from '@mysten/sui/utils'
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { ReponseError, ReponseOk } from "./response";

import { getFullnodeUrl } from '@mysten/sui/client';


export async function transferSui(account: string, amount: string) {
    let client = new SuiClient({ url: process.env.SUI_RPC || getFullnodeUrl("devnet") })
    let keypair = Ed25519Keypair.fromSecretKey(process.env.SUI_PRIVATEKEY || "",)
    let objectId = process.env.TOKEN_PROJECT_ID || ""

    if (!isValidSuiAddress(account)) {
        throw new Error("invalid sui address")
    }

    try {
        BigInt(amount)
    } catch {
        throw new Error("invalid amount")
    }

    try {
        const txb = new Transaction();
        // 拆分代币
        const [coinToTransfer] = txb.splitCoins(objectId, [amount]);

        // 转账到目标地址
        txb.transferObjects([coinToTransfer], account);


        // 获取 Gas 对象
        let gasPayment = await client.getCoins({
            owner: keypair.toSuiAddress(),
            coinType: '0x2::sui::SUI',
        });

        if (gasPayment.data.length === 0) {
            throw new Error('No SUI coins found for gas payment.');
        }

        let payments: ObjectRef[] = []
        gasPayment.data.forEach((coin) => {
            payments.push({
                objectId: coin.coinObjectId,
                version: coin.version,
                digest: coin.digest,
            })
        })


        // 设置 Gas 支付
        txb.setGasPayment(payments);

        // 模拟执行, 防止有误
        let res = await client.devInspectTransactionBlock({
            sender: keypair.toSuiAddress(),
            transactionBlock: txb,
        })

        // 获取交易数据
        if (res.effects.status.status != "success") {
            throw new Error(res.effects.status.error || "transaction failed");
        }

        // 签名并发送交易
        const result = await client.signAndExecuteTransaction({
            transaction: txb,
            signer: keypair,
        });
        return result.digest
    } catch (error) {
        throw new Error(`internel failed: ${error}`);
    }


}
