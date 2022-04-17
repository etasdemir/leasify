import { storage, Context, PersistentMap, PersistentSet } from "near-sdk-core"
import { u128 } from 'near-sdk-as';
import {AccountId, assert_self, Balance, Money} from './utils';
import { BUILD_TYPE, LESSOR_MAP_PREFIX, LESSE_MAP_PREFIX, ASSET_MAP_PREFIX, ASSET_IDS_PREFIX } from "./Constants";
import Lessor from "./models/Lessor";
import Lesse from "./models/Lesse";
import Asset from "./models/Asset";

@nearBindgen
export class Contract {
  lessorMap = new PersistentMap<AccountId, Lessor>(LESSOR_MAP_PREFIX);
  lesseMap = new PersistentMap<AccountId, Lesse>(LESSE_MAP_PREFIX);
  assetMap = new PersistentMap<string, Asset>(ASSET_MAP_PREFIX);
  assetIds = new PersistentSet<string>(ASSET_IDS_PREFIX);

  constructor() {
    if (BUILD_TYPE === "DEV") {
      this.generateAssets();
    }
  }

  getBuyableAssets(): Array<Asset> {
    const assets = new Array<Asset>();
    this.assetIds.values().forEach((id) => {
      const asset = this.getAssetById(id);
      if (!asset.ownedBy) {
        assets.push(asset);
      }
    })
    return assets;
  }
  
  getLeasebleAssets(): Array<Asset> {
    const assets = new Array<Asset>();
    this.assetIds.values().forEach((id) => {
      const asset = this.getAssetById(id);
      if (!asset.leasedBy) {
        assets.push(asset);
      }
    })
    return assets;
  }

  /**
   * Lessor methods
   */

  @mutateState()
  buyAsset(assetId: string) {
    const lessor = this.getLessor();
    const asset = this.getAssetById(assetId);
  }

  getAccumulatedIncome(): Balance {
    const lessor = this.getLessor();
    return lessor.accumulatedIncome;
  }

  getOwnedAssets() {
    const lessor = this.getLessor();
    const ownedAssets = new Array<Asset>();
    lessor.ownedAssetIds.values().forEach((assetId) => {
      const asset = this.getAssetById(assetId);
      if (asset.ownedBy === lessor.id) {
        ownedAssets.push(asset);
      }
    })
    return ownedAssets;
  }

  @mutateState()
	transferAccumulatedIncome() {
    const lessor = this.getLessor();
    assert(lessor.accumulatedIncome > u128.from(0), "Accumulated amount can not be less than or equal to 0");
  }

  @mutateState()
	sellAsset(assetId: string) {
    const lessor = this.getLessor();
    const asset = this.getAssetById(assetId);
  }

  /**
   * Lesse methods
   */

   @mutateState()
  payLease(assetId: string) {
    const lesse = this.getLesse();
    const asset = this.getAssetById(assetId);
  }

  getLeasedAssets(): Array<Asset> {
    const lesse = this.getLesse();
    const leasedAssets = new Array<Asset>();
    lesse.leasedAssetIds.values().forEach((assetId) => {
      const asset = this.getAssetById(assetId);
      if (asset.leasedBy === lesse.id) {
        leasedAssets.push(asset);
      }
    })
    return leasedAssets;
  }

  @mutateState()
  releaseAsset(assetId: string) {
    let lesse = this.getLesse();
    const asset = this.getAssetById(assetId);
    // If success
    // transfer asset deposit amount from lesse depositBalance to lesse wallet
    lesse = lesse.removeAsset(assetId);
    this.lesseMap.set(lesse.id, lesse);
    asset.leasedBy = '';
    this.assetMap.set(asset.id, asset);
  }

  private getLessor(): Lessor {
    const sender: AccountId = Context.sender;
    const lessor = this.lessorMap.get(sender, null);
    assert(lessor !== null, "Lessor not found.");
    assert(lessor!.id === sender, "Incorrect caller or it is not a lessor")
    return lessor!;
  }

  private getLesse(): Lesse {
    const sender: AccountId = Context.sender;
    const lesse = this.lesseMap.get(sender, null);
    assert(lesse !== null, "Lesse not found.");
    assert(lesse!.id === sender, "Incorrect caller or it is not a lesse")
    return lesse!;
  }

  private getAssetById(assetId: string): Asset {
    const asset = this.assetMap.get(assetId, null);
    assert(asset !== null, `Asset not found with id: ${assetId}`);
    return asset!;
  }

  private generateAssets() {
    assert_self();

  }
}
