import { u128 } from 'near-sdk-as';
import {Balance} from '../utils';

@nearBindgen
export default class Lesse {
    id: string
	depositBalance: Balance
	leasedAssetIds: Set<string>

    constructor(id: string) {
        this.id = id;
        this.depositBalance = u128.from(0);
        this.leasedAssetIds = new Set<string>();
    }

    addAsset(assetId: string): Lesse {
        this.leasedAssetIds.add(assetId);
        return this;
    }

    removeAsset(assetId: string): Lesse {
        this.leasedAssetIds.delete(assetId);
        return this;
    }
}
