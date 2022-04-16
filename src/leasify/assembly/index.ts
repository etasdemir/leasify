import { storage, Context, PersistentMap, PersistentSet } from "near-sdk-core"
import {AccountId, assert_self} from './utils';
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
    let assets = new Array<Asset>;
    this.assetIds.values().forEach((id) => {
      let asset = this.assetMap.getSome(id)
      if (!asset.isOwned) {
        assets.push(asset);
      }
    })
    return assets;
  }
  
  getLeasebleAssets(): Array<Asset> {
    let assets = new Array<Asset>;
    this.assetIds.values().forEach((id) => {
      let asset = this.assetMap.getSome(id)
      if (!asset.isLeased) {
        assets.push(asset);
      }
    })
    return assets;
  }

  /**
   * Lessor methods
   */

  buyAsset(assetId: string) {
    const lessor = this.getLessor();
    const asset = this.getAssetById(assetId);
  }

  getAccumulatedIncome() {
    const lessor = this.getLessor();
  }

  getOwnedAssets() {
    const lessor = this.getLessor();
  }

	transferAccumulatedIncome() {
    const lessor = this.getLessor();
  }

	sellAsset(assetId: string) {
    const lessor = this.getLessor();
    const asset = this.getAssetById(assetId);
  }

  /**
   * Lesse methods
   */

  payLease(assetId: string) {
    const lesse = this.getLesse();
    const asset = this.getAssetById(assetId);
  }

  getLeasedAssets() {
    const lesse = this.getLesse();
  }

  releaseAsset(assetId: string) {
    const lesse = this.getLesse();
    const asset = this.getAssetById(assetId);
  }

  private getLessor(): Lessor {
    const sender: AccountId = Context.sender;
    const lessor: Lessor = this.lessorMap.getSome(sender);
    assert(lessor.id === sender, "Incorrect caller or it is not a lessor")
    return lessor;
  }

  private getLesse(): Lesse {
    const sender: AccountId = Context.sender;
    const lesse: Lesse = this.lesseMap.getSome(sender);
    assert(lesse.id === sender, "Incorrect caller or it is not a lesse")
    return lesse;
  }

  private getAssetById(assetId: string): Asset {
    return this.assetMap.getSome(assetId);
  }

  private generateAssets() {
    assert_self();

  }
}
