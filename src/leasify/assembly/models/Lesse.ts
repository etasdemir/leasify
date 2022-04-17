import { u128 } from 'near-sdk-as';
import {Balance, Amount} from '../utils';

@nearBindgen
export default class Lesse {
    id: string
	depositBalance: Balance
	leasedAssetIds: Set<string>

    constructor(id: string) {
        this.id = id;
        this.depositBalance = u128.Zero;
        this.leasedAssetIds = new Set<string>();
    }

    addAsset(assetId: string): void {
        this.leasedAssetIds.add(assetId);
    }

    removeAsset(assetId: string, depositAmount: Amount): void {
        this.leasedAssetIds.delete(assetId);
        this.depositBalance = u128.sub(this.depositBalance, depositAmount);
    }
}
