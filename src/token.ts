import { t, type Context } from "elysia"
// import type { Context } from 'elysia'
// import { t } from "elysia"
import { SuiClient, type CoinStruct } from '@mysten/sui/client';
import { Transaction, type ObjectRef } from "@mysten/sui/transactions";
import { isValidSuiAddress } from '@mysten/sui/utils'
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { ReponseError, ReponseOk } from "./response";

export const accountInfoBody = t.Object({
    account: t.String(),
    balance: t.String(),
})

type AccountInfo = typeof accountInfoBody.static

function checkAccountInfo(info: AccountInfo): string {
    if (!isValidSuiAddress(info.account)) {
        return "invalid sui address"
    }

    try {
        BigInt(info.balance)
    } catch {
        return "invalid balance"
    }
    return ""
}

export const accountInfosBody = t.Array(
    accountInfoBody
)
type AccountInfos = typeof accountInfosBody.static
function checkAccountInfos(data: AccountInfos): string {
    for (let i = 0; i < data.length; i++) {
        let checkRes = checkAccountInfo(data[i])
        if (checkRes != "") {
            return checkRes
        }
    }
    return ""
}


export class Token {
    client: SuiClient
    keypair: Ed25519Keypair
    objectId: string
    constructor(url: string, pri: string, objectId: string) {
        this.client = new SuiClient({ url: url })
        this.keypair = Ed25519Keypair.fromSecretKey(pri)
        this.objectId = objectId

        // const { schema, secretKey } = decodeSuiPrivateKey(pri);
        // // use schema to choose the correct key pair
        // const keypair = Ed25519Keypair.fromSecretKey(secretKey);
        // console.log(keypair.toSuiAddress())
    }

    public error(context: Context) {
        context.set.status = 400
        return 'bad request';
    }

    public getBalance = async ({ params: { account } }: Context) => {
        if (!isValidSuiAddress(account)) {
            return ReponseError(400, "invalid sui address")
        }
        let balance = await this.client.getBalance({
            owner: account,
            coinType: "0x2::sui::SUI",
        })
        return ReponseOk(balance)
    }

    public transfer = async ({ body }: Context) => {
        let data = body as AccountInfo
        let checkRes = checkAccountInfo(data)
        if (checkRes != "") {
            return ReponseError(400, checkRes)
        }

        try {
            const txb = new Transaction();
            // 拆分代币
            const [coinToTransfer] = txb.splitCoins(this.objectId, [data.balance]);

            // 转账到目标地址
            txb.transferObjects([coinToTransfer], data.account);


            // 获取 Gas 对象
            let gasPayment = await this.client.getCoins({
                owner: this.keypair.toSuiAddress(),
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
            let res = await this.client.devInspectTransactionBlock({
                sender: this.keypair.toSuiAddress(),
                transactionBlock: txb,
            })

            // 获取交易数据
            if (res.effects.status.status != "success") {
                return ReponseError(400, res.effects.status.error || "transaction failed")
            }

            // 签名并发送交易
            const result = await this.client.signAndExecuteTransaction({
                transaction: txb,
                signer: this.keypair,
            });
            return ReponseOk(result.digest)
        } catch (error) {
            return ReponseError(500, `internel failed: ${error}`)
        }
    }

    public batchTransfer = async ({ body }: Context) => {
        let data = body as AccountInfos
        let checkRes = checkAccountInfos(data)
        if (checkRes != "") {
            return new Response(checkRes, { status: 400 })
        }

        try {
            const txb = new Transaction();
            data.forEach((info) => {
                // 拆分代币
                const [coinToTransfer] = txb.splitCoins(this.objectId, [info.balance]);

                // 转账到目标地址
                txb.transferObjects([coinToTransfer], info.account);
            })


            // 获取 Gas 对象
            let gasPayment = await this.client.getCoins({
                owner: this.keypair.toSuiAddress(),
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
            let res = await this.client.devInspectTransactionBlock({
                sender: this.keypair.toSuiAddress(),
                transactionBlock: txb,
            })

            // 获取交易数据
            if (res.effects.status.status != "success") {
                return ReponseError(400, res.effects.status.error || "transaction failed")
            }

            // 签名并发送交易
            const result = await this.client.signAndExecuteTransaction({
                transaction: txb,
                signer: this.keypair,
            });
            return ReponseOk(result.digest)
        } catch (error) {
            return ReponseError(500, `internel failed: ${error}`)
        }
    }

    public mergeSui = async () => {
        const gasPayment = await this.client.getCoins({
            owner: this.keypair.toSuiAddress(),
            coinType: '0x2::sui::SUI',
        });
        if (gasPayment.data.length < 2) {
            return ReponseError(400, 'no need to merge')
        }
        let tx = new Transaction();

        let payments: ObjectRef[] = []
        gasPayment.data.forEach((coin) => {
            payments.push({
                objectId: coin.coinObjectId,
                version: coin.version,
                digest: coin.digest,
            })
        })

        // 设置 Gas 支付
        tx.setGasPayment(payments);

        const result = await this.client.signAndExecuteTransaction({
            transaction: tx,
            signer: this.keypair,
        });
        return ReponseOk(result.digest)
    }
}