transfer token api
---

### 1、create token
[create token](https://www.suicoins.com/create-coin)

### 2、set .env
```
NODE_ENV=production # development | production 
SUI_PRIVATEKEY=suiprivkeyxxxxxxxxxxxxxxxxxxxxxxxx # private key will be used when transfer token
TOKEN_PROJECT_ID=0x0000000000000000000000000000000000000000 # object id of FungAgenttoken
SUI_RPC="https://fullnode.testnet.sui.io:443" # sui rpc
```

### 3、run
* [how to install bun](https://bun.sh/docs/installation)
  
* init
```
yarn
```

* run
```
yarn start
```