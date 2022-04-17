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
}