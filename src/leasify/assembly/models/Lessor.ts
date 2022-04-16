import {Money} from '../utils';

@nearBindgen
export default class Lessor {
    id: string
	accumulatedIncome: Money
	ownedAssets: [string]
}
