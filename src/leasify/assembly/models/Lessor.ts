import { u128 } from 'near-sdk-as';
import {Balance} from '../utils';

@nearBindgen
export default class Lessor {
    id: string
	accumulatedIncome: Balance
	ownedAssetIds: Set<string>

    constructor(id: string) {
        this.id = id;
        this.accumulatedIncome = u128.from(0);
        this.ownedAssetIds = new Set<string>();
    }

    addAsset(assetId: string): Lessor {
        this.ownedAssetIds.add(assetId);
        return this;
    }

    removeAsset(assetId: string): Lessor {
        this.ownedAssetIds.delete(assetId);
        return this;
    }
}
