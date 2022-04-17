import { Money, AccountId } from "../utils"

@nearBindgen
export default class Asset {
    id: string
    price: Money
    leasePrice: Money
    leasePayPeriodInSec: i64
    periodicIncome: Money
    depositAmount: Money
    ownedBy: AccountId
    leasedBy: AccountId

    constructor(id: string, price: Money, leasePrice: Money, 
                leasePayPeriodInSec: i64, periodicIncome: Money, 
                depositAmount: Money) 
    {
        this.id = id;
        this.price = price;
        this.leasePrice = leasePrice;
        this.leasePayPeriodInSec = leasePayPeriodInSec;
        this.periodicIncome = periodicIncome;
        this.depositAmount = depositAmount;
        this.ownedBy = '';
        this.leasedBy = '';
    }
}