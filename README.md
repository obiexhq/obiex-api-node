# Obiex Node API Wrapper

> An API wrapper for the [Obiex](https://obiex.com) API.

### Installation

    npm install obiexhq/obiex-api-node

### Getting started

Import the client module and create a new client. Passing sandbox mode is optional and it's false by default. The sandbox mode determines if you want to use the Obiex staging or production server. Setting sandbox as true uses the staging server.

```js
import { ObiexClient } from 'obiex-api-node'

// Authenticated client, can make signed calls
const client = new ObiexClient({
  apiKey: 'xxx',
  apiSecret: 'xxx',
  sandboxMode: xxx,
})

```

### Table of Contents
- [Initialization](#Initialization)
- [Public REST Endpoints](#public-rest-endpoints)
  - [Get trade history](#getTradeHistory)
- [ServerErrors](#ServerErrors)

### Initialization

| Param       | Type     | Required | Info                                         |
| ----------- | -------- | -------- | -------------------------------------------- |
| apiKey      | String   | false    | Required when making private calls           |
| apiSecret   | String   | false    | Required when making private calls           |
| sandboxMode   | Function | false    | Required to be true in development/test enviroment        |

### Public REST Endpoints

#### getTradeHistory

```js
console.log(await client.getTradePairs())
```

<details>
<summary>Output</summary>

```js
[
  {
    id: 'be3854e1-b675-4ace-877e-32caeb582dc5',
    isSellable: true;
    isBuyable: true;
    source: {
        id: 'de3854e1-b675-5ace-977e-32caeb582dc5',
        name: 'string';
        code: 'BTC';
        receivable: true;
        withdrawable: true;
        transferrable: boolean;
        minimumDeposit: 10;
        maximumDeposit: 10000;
        maximumDailyDepositLimit: 100;
        maximumDecimalPlaces: 8;
    },
    target: {
        id: 'ae3854e1-b675-4dee-977e-62caeb582dd2',
        name: 'string';
        code: 'NGNX';
        receivable: true;
        withdrawable: true;
        transferrable: boolean;
        minimumDeposit: 100;
        maximumDeposit: 100000;
        maximumDailyDepositLimit: 1000;
        maximumDecimalPlaces: 2;
    },;
  }
]
```

</details>

#### getDepositAddress

```js
console.log(await client.getDepositAddress('USDT', 'TRX', 'wallet for spending'))
```

| Param  | Type   | Required | Default |
| ------ | ------ | -------- | ------- |
| currency | String | true    |         |
| network | String | true    |         |
| identifier | String | true    |         |

<details>
<summary>Output</summary>

```js
  {
    address: 'string',
    memo: 'string',
    network: 'string',
    identifier: 'purpose',
  }
```
</details>

#### getTradePairsByCurrency

```js
console.log(await client.getTradePairsByCurrency('3854e1-b675-5ace-977e-32caeb582'))
```

| Param  | Type   | Required | Default |
| ------ | ------ | -------- | ------- |
| currencyId | String | true    |         |

<details>
<summary>Output</summary>

```js
[
  {
    id: 'be3854e1-b675-4ace-877e-32caeb582dc5',
    isSellable: true;
    isBuyable: true;
    source: {
        id: 'de3854e1-b675-5ace-977e-32caeb582dc5',
        name: 'string';
        code: 'BTC';
        receivable: true;
        withdrawable: true;
        transferrable: boolean;
        minimumDeposit: 10;
        maximumDeposit: 10000;
        maximumDailyDepositLimit: 100;
        maximumDecimalPlaces: 8;
    },
    target: {
        id: 'ae3854e1-b675-4dee-977e-62caeb582dd2',
        name: 'string';
        code: 'NGNX';
        receivable: true;
        withdrawable: true;
        transferrable: boolean;
        minimumDeposit: 100;
        maximumDeposit: 100000;
        maximumDailyDepositLimit: 1000;
        maximumDecimalPlaces: 2;
    },;
  }
]
```
</details>

#### createQuote

```js
console.log(await client.createQuote('USDT', 'BNB', 'SELL', 100))
```

| Param  | Type   | Required |
| ------ | ------ | -------- |
| source | String | true    |
| target | String | true    |
| side | String | true    |
| amount | Number | true    |

<details>
<summary>Output</summary>

```js
  {
    id: String,
    rate: Number,
    side: String,
    amount: Number,
    expiryDate: Date,
    amountReceived: Number,
  }
```
</details>

#### trade

```js
console.log(await client.trade('USDT', 'BNB', 'SELL', 100))
```

| Param  | Type   | Required |
| ------ | ------ | -------- |
| source | String | true    |
| target | String | true    |
| side | String | true    |
| amount | Number | true    |

<details>
<summary>Output</summary>

```js
  {
    id: String,
    rate: Number,
    side: String,
    amount: Number,
    expiryDate: Date,
    amountReceived: Number,
  }
```
</details>

#### acceptQuote

```js
console.log(await client.acceptQuote('quoteId');
```

| Param  | Type   | Required |
| ------ | ------ | -------- |
| quoteId | String | true    |

<details>
<summary>Output</summary>

```js
  Boolean
```
</details>

#### withdrawCrypto

```js
console.log(await client.withdrawCrypto('BTC', 100, {
  address: 'string';
  network: 'string';
  memo?: 'string';
});
```

| Param        | Type   | Required      |
| ------       | ------ | --------      |
| currencyCode | String | true    |
| amount       | Number | true    |
| address      | String | true    |
| network      | String | true    |
| memo         | String | false   |

#### withdrawNaira

```js
console.log(await client.withdrawNaira(100, {
  accountNumber: 'string';
  accountName: 'string';
  bankName: 'string';
  bankCode: 'string';
  merchantCode: 'string';
});
```

| Param         | Type   | Required      |
| ------        | ------ | --------      |
| amount        | Number | true    |
| accountNumber | String | true    |
| accountName   | String | true    |
| bankName      | String | true   |
| bankCode      | String | true   |
| merchantCode  | String | true   |


#### getBanks

```js
console.log(await client.getBanks();
```

#### getCurrencies

```js
console.log(await client.getCurrencies();
```

<details>
<summary>Output</summary>

```js
  [
    {
      id: String,
      name: String,
      code: String,
      receivable: Boolean,
      withdrawable: Boolean,
      transferrable: Boolean,
      minimumDeposit: Number,
      maximumDailyDeposit: Number,
      maximumDecimalPlaces: Number,
    }
  ]
```
</details>

#### getNetworks

```js
console.log(await client.getNetworks('BTC');
```

| Param         | Type   | Required |
| ------        | ------ | -------- |
| currencyCode  | String | true     |

<details>
<summary>Output</summary>

```js
  [
    {
      id: String;
      name: String;
      code: String;
      memoRegex: String;
      addressRegex: String;
      minimumConfirmations: Number;
    }
  ]
```
</details>

#### getActiveNetworks

```js
console.log(await client.getActiveNetworks());
```

<details>
<summary>Output</summary>

```js
  {
    [CURRENCY_CODE]: {
      currencyName: String,
      networks: [
        {
          networkName: String,
          networkCode: String,
          minimumDeposit: Number,
          depositFee: Number,
          minimumWithdrawal: Number,
          withdrawalFee: Number,
          maximumDecimalPlaces: Number,
          receiveFeeType: String,
          withdrawalFeeType: String,
        }
      ]
    }
  } 
```
</details>

#### getNairaMerchants

```js
console.log(await client.getNairaMerchants(1, 30);
```

| Param     | Type   | Required |
| ------    | ------ | -------- |
| page      | Number | false    |
| pageSize  | Number | false    |

<details>

```js
  [
    {
      id: string;
      createdAt: string;
      updatedAt: string;
      active: boolean;
      code: string;
      depositFee: number;
      payoutFee: number;
      userId: string;
      user: {
        id: string;
        createdAt: string;
        updatedAt: string;
        active: boolean;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
      };
      totalRequests: number;
      completedRequests: number;
    }
  ]
```
</details>
#### getTransactionHistory

```js
console.log(await client.getTransactionHistory(1, 30, 'DEPOSIT');

enum TransactionCategory {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  SWAP = "SWAP",
  TRANSFER = "TRANSFER",
}
```

| Param                | Type   | Required |
| -------------------  | ------ | -------- |
| page                 | Number | false    |
| pageSize             | Number | false    |
| transactionCategory  | Enum   | false     |

#### getOrCreateWallet

```js
console.log(await client.getOrCreateWallet('NGNX');
```

| Param         | Type   | Required |
| ------        | ------ | -------- |
| currencyCode  | String | true    |

#### getTradeHistory

```js
console.log(await client.getTradeHistory(1, 30);
```

| Param     | Type   | Required |
| ------    | ------ | -------- |
| page      | Number | false    |
| pageSize  | Number | false    |

#### getTransactionById

```js
console.log(await client.getTransactionById('3854e1-b675-5ace-977e-32caeb582');
```

| Param           | Type   | Required |
| ------          | ------ | -------- |
| transactionId   | String | true    |


#### getCurrencyByCode

```js
console.log(await client.getCurrencyByCode('ETH');
```

| Param  | Type   | Required |
| ------ | ------ | -------- |
| code   | String | true    |

<details>
<summary>Output</summary>

```js
  {
    id: String,
    name: String,
    code: String,
    receivable: Boolean,
    withdrawable: Boolean,
    transferrable: Boolean,
    minimumDeposit: Number,
    maximumDailyDeposit: Number,
    maximumDecimalPlaces: Number,
  }
```
</details>

#### requestNairaDepositBankAccount

```js
console.log(await client.requestNairaDepositBankAccount('AAA', 10000);
```

| Param          | Type   | Required | Description |
| ------         | ------ | -------- |  --------   |
| merchantCode   | String | true     |  This is code gotten from fetching getNairaMerchants()  |
| amount         | Number | true     |


#### verifyNairaDeposit

```js
console.log(await client.verifyNairaDeposit('ae3854e1-b675-4dee-977e-62caeb582dd2');
```

| Param      | Type   | Required |
| ------     | ------ | -------- |
| reference  | String | true     |


#### verifyNairaWithdrawal

```js
console.log(await client.verifyNairaWithdrawal('ae3854e1-b675-4dee-977e-62caeb582dd2');
```

| Param      | Type   | Required |
| ------     | ------ | -------- |
| reference  | String | true     |


#### resolveNairaBankAccount

```js
console.log(await client.resolveNairaBankAccount(bankId, accountNumber);
```

| Param         | Type   | Required |
| ------------  | ------ | -------- |
| bankId        | String | true     |
| accountNumber | String | true     |

<details>
<summary>Output</summary>

```js
  {
    bankId: String,
    accountNumber: String,
    accountName: String,
  }
```
</details>

### ServerErrors

A server error is also being exported by the package in order for you to make readable
conditionals upon specific errors that could occur while using the API.

```js
import { ServerError } from 'obiex-api-node'

console.log(ServerError) // { message: string, data: object, statusCode: number }
```
