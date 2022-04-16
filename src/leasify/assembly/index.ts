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

  getBuyableAssets() {
    // return this.contractAssets.filter((asset) => !asset.isOwned)
  }
  
  getLeasebleAssets() {
    // return this.contractAssets.filter((asset) => !asset.isLeased)
  }

  /**
   * Lessor methods
   */

  buyAsset(assetId: string) {
    const lessor = this.getLessor();
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
  }

  /**
   * Lesse methods
   */

  payLease(assetId: string) {
    const lesse = this.getLesse();
  }

  getLeasedAssets() {
    const lesse = this.getLesse();
  }

  releaseAsset(assetId: string) {
    const lesse = this.getLesse();
  }

  private getLessor(): Lessor {
    const sender: AccountId = Context.sender;
    const lessor: Lessor = this.lessorMap.getSome(sender);
    return lessor;
  }

  private getLesse(): Lesse {
    const sender: AccountId = Context.sender;
    const lesse: Lesse = this.lesseMap.getSome(sender);
    return lesse;
  }

  private generateAssets() {
    assert_self();

  }
}
