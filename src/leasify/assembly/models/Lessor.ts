import {Balance} from '../utils';

@nearBindgen
export default class Lessor {
    id: string
	accumulatedIncome: Balance
	ownedAssetIds: Set<string>

    addAsset(asset: string) {

    }

    removeAsset(assetId: string): Lessor {
        this.ownedAssetIds.delete(assetId);
        return this;
    }
}
