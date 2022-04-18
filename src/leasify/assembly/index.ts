import { Context, math, PersistentMap, PersistentSet } from "near-sdk-core"
import { ContractPromiseBatch, u128, logging, RNG } from 'near-sdk-as';
import {AccountId, assert_self, Balance, Money, toYocto} from './utils';
import { BUILD_TYPE, LESSOR_MAP_PREFIX, LESSEE_MAP_PREFIX, ASSET_MAP_PREFIX, ASSET_IDS_PREFIX } from "./Constants";
import {Lessor} from "./models/Lessor";
import {Lessee} from "./models/Lessee";
import {Asset} from "./models/Asset";

@nearBindgen
export class Contract {
  private lessorMap: PersistentMap<AccountId, Lessor> = new PersistentMap(LESSOR_MAP_PREFIX);
  private lesseeMap: PersistentMap<AccountId, Lessee> = new PersistentMap(LESSEE_MAP_PREFIX);
  private assetMap: PersistentMap<string, Asset> = new PersistentMap(ASSET_MAP_PREFIX);
  private assetIds: PersistentSet<string> = new PersistentSet(ASSET_IDS_PREFIX);

  // near call $contract generateMockAssets --accountId $account --gas=300000000000000 
  @mutateState()
  generateMockAssets(): string {
    assert(BUILD_TYPE === "DEV", "generateAssets method can be called only in development environment");
    // assert_self();
    const MOCK_ASSET_COUNT = 20;
    assert(this.assetIds.size < MOCK_ASSET_COUNT, "Mock assests already created");
    const rng = new RNG<u32>(MOCK_ASSET_COUNT * 4, 1000);
    for (let i = 0; i < MOCK_ASSET_COUNT; i++) {
      const id = math.hash32<u32>(rng.next()).toString();
      const price = u128.div(toYocto(rng.next()), u128.from(1000));
      const leasePrice = u128.div(price, u128.from(30));
      const periodicIncome = leasePrice;
      const deposit = u128.mul(leasePrice, u128.from(6));
      const asset = new Asset(id, price, leasePrice, periodicIncome, deposit);
      this.assetIds.add(id);
      this.assetMap.set(id, asset);
    }
    return 'Mock assets are generated.';
  }

  getBuyableAssets(): Array<Asset> {
    const assets: Array<Asset> = new Array<Asset>();
    const assetIds: string[] = this.assetIds.values();
    for (let i = 0; i < assetIds.length; i++) {
      const asset: Asset = this.getAssetById(assetIds[i]);
      if (!asset.ownedBy) {
        assets.push(asset);
      }
    }
    return assets;
  }

  getLeasebleAssets(): Array<Asset> {
    const assets: Array<Asset> = new Array<Asset>();
    const assetIds: string[] = this.assetIds.values();
    for (let i = 0; i < assetIds.length; i++) {
      const asset: Asset = this.getAssetById(assetIds[i]);
      if (!asset.leasedBy) {
        assets.push(asset);
      }
    }
    return assets;
  }

  getAssetById(assetId: string): Asset {
    const asset = this.assetMap.get(assetId, null);
    assert(asset != null, `Asset not found with id: ${assetId}`);
    return asset!;
  }

  /**
   * Lessor methods
   */

  @mutateState()
  buyAsset(assetId: string): bool {
    const asset: Asset = this.getAssetById(assetId);
    assert(!asset.isOwned(), 'Asset already owned.');
    const sender = Context.sender;
    const contract = Context.contractName;
    const buy_asset = ContractPromiseBatch.create(contract);
    buy_asset.transfer(asset.price);
    asset.buyAsset(sender);
    this.assetMap.set(assetId, asset);
    const lessor = this.getLessorOrCreate(sender);
    lessor.addAsset(asset.id);
    this.lessorMap.set(sender, lessor);
    logging.log(`Success. Asset with id: ${assetId} bought by ${sender}`);
    return true;
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
    const assetIds = lessor.ownedAssetIds.values();
    for (let index = 0; index < assetIds.length; index++) {
      const assetId = assetIds[index];
      const asset = this.getAssetById(assetId);
      if (asset.ownedBy == lessor.id) {
        ownedAssets.push(asset);
      }
    }
    return ownedAssets;
  }

  @mutateState()
	transferAccumulatedIncome(amount: Money): bool {
    const sender = Context.sender;
    const lessor = this.getLessor(sender);
    assert(lessor.accumulatedIncome > u128.Zero, "Accumulated amount can not be less than or equal to 0");
    assert(amount > u128.Zero && amount <= lessor.accumulatedIncome, 
      "Requested amount should be bigger than 0, less than or equal to accumulated amount");
    const transferIncome = ContractPromiseBatch.create(lessor.id);
    transferIncome.transfer(amount);
    lessor.transferAccumulatedIncome(amount);
    this.lessorMap.set(sender, lessor);
    logging.log(`Success. ${amount} amount transfered to ${sender}`);
    return true;
  }

  @mutateState()
	sellAsset(assetId: string): bool {
    const sender = Context.sender;
    const lessor = this.getLessor(sender);
    const asset = this.getAssetById(assetId);
    const sell_asset = ContractPromiseBatch.create(lessor.id);
    sell_asset.transfer(asset.price);
    asset.sellAsset();
    this.assetMap.set(assetId, asset);
    lessor.removeAsset(assetId);
    this.lessorMap.set(lessor.id, lessor);
    logging.log(`Success. Asset with id: ${assetId} sold by ${sender}`);
    return true;
  }

  getLessor(sender: AccountId): Lessor {
    const lessor = this.lessorMap.get(sender, null);
    assert(lessor != null, "Lessor not found.");
    assert(lessor!.id == sender, "Incorrect caller or it is not a lessor")
    return lessor!;
  }

  private getLessorOrCreate(sender: AccountId): Lessor {
    return this.lessorMap.get(sender, new Lessor(sender))!;
  }

  /**
   * Lessee methods
   */
   @mutateState()
  leaseAsset(assetId: string): bool {
    const asset = this.getAssetById(assetId);
    assert(!asset.isLeased(), "Asset already leased");
    const sender = Context.sender;
    const lessee = this.getLesseeOrCreate(sender)
    const lease_asset = ContractPromiseBatch.create(Context.contractName);
    lease_asset.transfer(asset.depositAmount);
    asset.leaseAsset(lessee.id);
    this.assetMap.set(assetId, asset);
    lessee.depositBalance = u128.add(lessee.depositBalance, asset.depositAmount);
    lessee.addAsset(assetId);
    this.lesseeMap.set(lessee.id, lessee);
    logging.log(`Success. Asset with id: ${assetId} leased by ${sender}`);
    return true;
  }

  @mutateState()
  payLease(assetId: string): bool {
    const sender = Context.sender;
    const lessee = this.getLessee(sender);
    const asset = this.getAssetById(assetId);
    const contract = Context.contractName;
    const pay_lease = ContractPromiseBatch.create(contract);
    pay_lease.transfer(asset.leasePrice);
    if (asset.isOwned()) {
      const lessor = this.getLessor(asset.ownedBy);
      lessor.accumulatedIncome = u128.add(lessor.accumulatedIncome, asset.leasePrice);
      this.lessorMap.set(lessor.id, lessor);
    }
    logging.log(`${sender} paid ${asset.leasePrice} for asset ${assetId}`);
    return true;
  }

  getLeasedAssets(): Array<Asset> {
    const sender = Context.sender;
    const lessee = this.getLessee(sender);
    const leasedAssets = new Array<Asset>();
    const leasedAssetIds = lessee.leasedAssetIds.values();
    for (let index = 0; index < leasedAssetIds.length; index++) {
      const assetId = leasedAssetIds[index];
      const asset = this.getAssetById(assetId);
      if (asset.leasedBy == lessee.id) {
        leasedAssets.push(asset);
      }
    }
    return leasedAssets;
  }

  @mutateState()
  releaseAsset(assetId: string): bool {
    const sender = Context.sender;
    const lessee = this.getLessee(sender);
    const asset = this.getAssetById(assetId);
    assert(lessee.depositBalance >= asset.depositAmount, "Insufficient deposit balance.");
    const transferDeposit = ContractPromiseBatch.create(lessee.id);
    transferDeposit.transfer(asset.depositAmount);
    lessee.removeAsset(assetId, asset.depositAmount);
    this.lesseeMap.set(lessee.id, lessee);
    asset.releaseAsset();
    this.assetMap.set(asset.id, asset);
    logging.log(`Success. Asset with id: ${assetId} released by ${sender}`);
    return true;
  }

  getLessee(sender: AccountId): Lessee {
    const lessee = this.lesseeMap.get(sender, null);
    assert(lessee != null, "Lessee not found.");
    assert(lessee!.id == sender, "Incorrect caller or it is not a lessee")
    return lessee!;
  }

  private getLesseeOrCreate(sender: AccountId): Lessee {
    return this.lesseeMap.get(sender, new Lessee(sender))!;
  }
}
