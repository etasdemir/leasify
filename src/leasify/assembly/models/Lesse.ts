import {Balance} from '../utils';

@nearBindgen
export default class Lesse {
    id: string
	depositBalance: Balance
	leasedAssetIds: Set<string>

    addAsset(assetId: string): Lesse {
        this.leasedAssetIds.add(assetId);
        return this;
    }

    removeAsset(assetId: string): Lesse {
        this.leasedAssetIds.delete(assetId);
        return this;
    }
}
