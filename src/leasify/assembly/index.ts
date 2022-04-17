import { Context, PersistentMap, PersistentSet } from "near-sdk-core"
import { ContractPromiseBatch, u128 } from 'near-sdk-as';
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
    this.generateAssets();
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
  buyAsset(assetId: string): void {
    const asset = this.getAssetById(assetId);
    assert(!asset.isOwned(), 'Asset already owned.');
    const sender = Context.sender;
    const contract = Context.contractName;
    const buy_asset = ContractPromiseBatch.create(contract);
    buy_asset.transfer(asset.price);
    this.lessorMap.set(sender, this.getLessorOrCreate(sender));
    asset.buyAsset(sender);
    this.assetMap.set(assetId, asset);
  }

  getAccumulatedIncome(): Balance {
    const sender = Context.sender;
    const lessor = this.getLessor(sender);
    return lessor.accumulatedIncome;
  }

  getOwnedAssets(): Array<Asset> {
    const sender = Context.sender;
    const lessor = this.getLessor(sender);
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
	transferAccumulatedIncome(amount: Money): void {
    const sender = Context.sender;
    const lessor = this.getLessor(sender);
    assert(lessor.accumulatedIncome > u128.Zero, "Accumulated amount can not be less than or equal to 0");
    assert(amount > u128.Zero && amount <= lessor.accumulatedIncome, 
      "Requested amount should be bigger than 0, less than or equal to accumulated amount");
    const transferIncome = ContractPromiseBatch.create(lessor.id);
    transferIncome.transfer(amount);
    lessor.transferAccumulatedIncome(amount);
    this.lessorMap.set(sender, lessor);
  }

  @mutateState()
	sellAsset(assetId: string): void {
    const sender = Context.sender;
    const lessor = this.getLessor(sender);
    const asset = this.getAssetById(assetId);
    const sell_asset = ContractPromiseBatch.create(lessor.id);
    sell_asset.transfer(asset.price);
    asset.sellAsset();
    this.assetMap.set(assetId, asset);
    lessor.removeAsset(assetId);
    this.lessorMap.set(lessor.id, lessor);
  }

  /**
   * Lesse methods
   */

  leaseAsset(assetId: string): void {
    const asset = this.getAssetById(assetId);
    assert(asset.isLeased(), "Asset already leased");
    const sender = Context.sender;
    const lesse = this.getLesseOrCreate(sender)
    const lease_asset = ContractPromiseBatch.create(Context.contractName);
    lease_asset.transfer(asset.depositAmount);
    asset.leaseAsset(lesse.id);
    this.assetMap.set(assetId, asset);
    lesse.depositBalance = u128.add(lesse.depositBalance, asset.depositAmount);
    this.lesseMap.set(lesse.id, lesse);
  }

  @mutateState()
  payLease(assetId: string): void {
    const sender = Context.sender;
    const lesse = this.getLesse(sender);
    const asset = this.getAssetById(assetId);
    const contract = Context.contractName;
    const pay_lease = ContractPromiseBatch.create(contract);
    pay_lease.transfer(asset.leasePrice);
    if (asset.isOwned()) {
      const lessor = this.getLessor(asset.ownedBy);
      lessor.accumulatedIncome = u128.add(lessor.accumulatedIncome, asset.leasePrice);
      this.lessorMap.set(lessor.id, lessor);
    }
  }

  getLeasedAssets(): Array<Asset> {
    const sender = Context.sender;
    const lesse = this.getLesse(sender);
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
  releaseAsset(assetId: string): void {
    const sender = Context.sender;
    const lesse = this.getLesse(sender);
    const asset = this.getAssetById(assetId);
    assert(lesse.depositBalance >= asset.depositAmount, "Insufficient deposit balance.");
    const transferDeposit = ContractPromiseBatch.create(lesse.id);
    transferDeposit.transfer(asset.depositAmount);
    lesse.removeAsset(assetId, asset.depositAmount);
    this.lesseMap.set(lesse.id, lesse);
    asset.releaseAsset();
    this.assetMap.set(asset.id, asset);
  }

  /**
   * Helper methods
   */

  private getLessor(sender: AccountId): Lessor {
    const lessor = this.lessorMap.get(sender, null);
    assert(lessor !== null, "Lessor not found.");
    assert(lessor!.id === sender, "Incorrect caller or it is not a lessor")
    return lessor!;
  }

  private getLessorOrCreate(sender: AccountId): Lessor {
    return this.lessorMap.get(sender, new Lessor(sender))!;
  }

  private getLesse(sender: AccountId): Lesse {
    const lesse = this.lesseMap.get(sender, null);
    assert(lesse !== null, "Lesse not found.");
    assert(lesse!.id === sender, "Incorrect caller or it is not a lesse")
    return lesse!;
  }

  private getLesseOrCreate(sender: AccountId): Lesse {
    return this.lesseMap.get(sender, new Lesse(sender))!;
  }

  private getAssetById(assetId: string): Asset {
    const asset = this.assetMap.get(assetId, null);
    assert(asset !== null, `Asset not found with id: ${assetId}`);
    return asset!;
  }

  private generateAssets(): void {
    assert(BUILD_TYPE === "DEV", "generateAssets method can be called only in development environment");
    assert_self();
    
  }
}
