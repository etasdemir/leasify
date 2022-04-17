import { Money, AccountId } from "../utils"

@nearBindgen
export default class Asset {
    id: string
    price: Money
    leasePrice: Money
    periodicIncome: Money
    depositAmount: Money
    ownedBy: AccountId
    leasedBy: AccountId

    constructor(id: string, price: Money, leasePrice: Money, periodicIncome: Money, depositAmount: Money) {
        this.id = id;
        this.price = price;
        this.leasePrice = leasePrice;
        this.periodicIncome = periodicIncome;
        this.depositAmount = depositAmount;
        this.ownedBy = '';
        this.leasedBy = '';
    }

    isLeased(): bool {
        return this.leasedBy !== '';
    }

    isOwned(): bool {
        return this.ownedBy !== '';
    }

    buyAsset(owner: string): void {
        this.ownedBy = owner;
    }

    sellAsset(): void {
        this.ownedBy = '';
    }

    leaseAsset(lesse: string): void {
        this.leasedBy = lesse;
    }

    releaseAsset(): void {
        this.leasedBy = '';
    }

}