# Welcome to Leasify!

**Leasify** is a trustless asset leasing smart contract deployed on NEAR testnet. It is written in AssemblyScript. With Leasify, you can buy asset and lease them. With that, you can get periodic income from your asset. Alternatively, you might want to lease an asset instead of buying. You only need to pay lease price periodically.


# Installation

1. Clone this repository: <br/>
`git clone https://github.com/etasdemir/leasify.git`
2. Install dependencies: <br/>
`yarn install`
4. Build and deploy the contract:  <br/>
`yarn dev-deploy`
> It will make a release build and deploy the smart contract.
5. Contract successfully deployed. Now, firstly you need to generate some mock assets: <br/>
`near call $CONTRACT_ID generateMockAssets --accountId $ACCOUNT_ID --gas=300000000000000   `
> **Note:** You need to increase gas amount for some commands by adding --gas=300000000000000 to the CLI command
7. At this step, you can freely interact with the contract.

# Methods and Usage

## Usage
Every functions can be called with: <br/>
`near call $CONTRACT_ID methodName '{"argName1": "argValue1"}' --accountId $ACCOUNT_ID --gas=300000000000000`

## Contract Methods
1. Generate mock assets. It will be used only in development environment. Before interacting with the contract, this method should be called. <br/>
`generateMockAssets(): string`
2. Get buyable assets. Buyable means not owned by anybody.  <br/>
`getBuyableAssets(): Array<Asset>`
3. Get leasable assets. Leasable means not leased by anybody.  <br/>
`getLeasebleAssets(): Array<Asset>`
4. Get asset info with id.  <br/>
`getAssetById(assetId: string): Asset`

## Lessor Methods
1. Get lessor by public account id. Returns Lessor.  <br/>
`getLessor(sender: AccountId): Lessor` <br/>
Usage:   <br/>
`near call dev-1650223408078-59961683836754 getLessor '{"sender": "erentasdemir.testnet"}' --accountId erentasdemir.testnet --gas=300000000000000`
2.  Buy assets. Return  true if success  <br/>
`buyAsset(assetId: string): bool`
3. Get accumulated income.  <br/>
`getAccumulatedIncome(): Balance`
4. Get assets owned by contract caller account.   <br/>
`getOwnedAssets(): Array<Asset>`
5. Transfer accumulated income from  contract to asset owner account.  <br/>
`transferAccumulatedIncome(amount: Money): bool`
6. Sell the asset.  <br/>
`sellAsset(assetId: string): bool`

## Lessee Methods
1. Get lessee by public account id.  <br/>
`getLessee(sender: AccountId): Lessee`
> **Note:** When an asset leased, lessee pay the asset deposit amount. It will be used for future implementations. After releasing the asset, deposit will be transfered back to lessee account. Future implementations 2nd and 3rd item.
3. Lease the asset given with id.  <br/>
`leaseAsset(assetId: string): bool`
4. Pay periodic lease amount.  <br/>
`payLease(assetId: string): bool`
5. Get assets leased by contract caller account.  <br/>
`getLeasedAssets(): Array<Asset>`
6. Release the asset.  <br/>
`releaseAsset(assetId: string): bool`	

# Future Implementations

1. Periodic income can be dynamic like percentage in case of asset price changes.
2. If a lessee do not pay its periodic lease amount, an interest rate should be added to the next lease amount.
3. If a lessee still not paying, when lease amount with the interest reaches deposit amount, automatically release asset and transfer deposit to the asset owner.
4. Partial lessor system. Instead of only one lessor for an asset, more than one people can buy a part of the asset. N Lessor - 1 Asset.
5. Adding new assets to the contract by users.
6. Gas price usage should be reduced.
7. Mobile app and web implementation to interact with the contract more easily.
