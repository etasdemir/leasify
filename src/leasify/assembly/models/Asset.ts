import { Money } from "../utils"
export default class Asset {
    id: string
    price: Money
    leasePrice: Money
    isOwned: bool
    isLeased: bool
}