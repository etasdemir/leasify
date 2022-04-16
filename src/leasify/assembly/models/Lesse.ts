import {Money} from '../utils';

@nearBindgen
export default class Lesse {
    id: string
	depositBalance: Money
	leasedAssets: [string]
}
