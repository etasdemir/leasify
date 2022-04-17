import { u128 } from 'near-sdk-as';
import {Balance, Money} from '../utils';

@nearBindgen
export default class Lessor {
    id: string
	accumulatedIncome: Balance
	ownedAssetIds: Set<string>

    constructor(id: string) {
        this.id = id;
        this.accumulatedIncome = u128.Zero;
        this.ownedAssetIds = new Set<string>();
    }

    transferAccumulatedIncome(amount: Money) {
        this.accumulatedIncome = u128.sub(this.accumulatedIncome, amount);
    }

    addAsset(assetId: string) {
        this.ownedAssetIds.add(assetId);
    }

    removeAsset(assetId: string) {
        this.ownedAssetIds.delete(assetId);
    }
}
