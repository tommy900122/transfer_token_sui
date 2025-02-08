import { Elysia, t } from "elysia"
import { Token, accountInfoBody, accountInfosBody } from "./token"
import { getFullnodeUrl } from '@mysten/sui/client';


const tokenObj = new Token(
    process.env.SUI_RPC || getFullnodeUrl("devnet"),
    process.env.SUI_PRIVATEKEY || "",
    process.env.TOKEN_PROJECT_ID || "",
)

export function router(app: Elysia) {
    app.get('/health', 'ok')

    app.group("/token", (app) =>
        app.post('/transfer', tokenObj.transfer, { body: accountInfoBody })
            .post('/batch-transfer', tokenObj.batchTransfer, { body: accountInfosBody })
        // .get('/balance/:account', tokenObj.getBalance, { params: t.Object({ account: t.String() }) })
    )
}