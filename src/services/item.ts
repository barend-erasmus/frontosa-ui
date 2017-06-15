// Imports
import * as co from 'co';
import * as mongo from 'mongodb';

// Imports models
import { Category } from './../models/category';
import { Item } from './../models/item';

export class ItemService {

    constructor(private uri: string) {

    }

    public listCategories(): Promise<Category> {
        const self = this;
        return co(function* () {

            const db: mongo.Db = yield mongo.MongoClient.connect(self.uri);

            const collection: mongo.Collection = db.collection('items');

            const data: any[] = yield collection.aggregate([
                {
                    $group: {
                        _id: { categoryCode: '$categoryCode', categoryName: '$categoryName' },
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();

            db.close();

            const categories: Category[] = data.map((x) => new Category(x._id.categoryCode, x._id.categoryName, x.count));

            return categories.sort((a, b) => {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            });
        });
    }

    public findCategory(code: string): Promise<Category> {
        const self = this;
        return co(function* () {
            const categories: Category[] = yield self.listCategories();

            return categories.find((x) => x.code === code);
        });
    }

    public listItems(categoryCode: string, query: string, sortPropertyName: string, start: number, length: number, minPrice: string, maxPrice: string): Promise<Item[]> {
        const self = this;
        return co(function* () {

            const db: mongo.Db = yield mongo.MongoClient.connect(self.uri);

            const collection: mongo.Collection = db.collection('items');

            const findQuery: {} = {};

            if (categoryCode) {
                findQuery['categoryCode'] = categoryCode;
            }


            if (minPrice && maxPrice) {
                findQuery['price'] = { $lte: parseFloat(maxPrice), $gte: parseFloat(minPrice) };
            } else if (minPrice) {
                findQuery['price'] = { $gte: parseFloat(minPrice) };
            } else if (maxPrice) {
                findQuery['price'] = { $lte: parseFloat(maxPrice) };
            }

            const sortQuery: {} = {};
            sortQuery[sortPropertyName] = 1;

            let items: Item[] = yield collection.find(findQuery).sort(sortQuery).toArray();

            items = query? items.filter((x: Item) => self.filter(x, query)) : items;
            items = items.slice(start, start + length);

            db.close();

            return items;
        });
    }

    public findItem(code: string): Promise<Item> {
        const self = this;
        return co(function* () {

            const db: mongo.Db = yield mongo.MongoClient.connect(self.uri);

            const collection: mongo.Collection = db.collection('items');

            const item: Item = yield collection.findOne({
                code: code
            });

            db.close();

            return item;
        });
    }

    public numberOfPages(categoryCode: string, query: string, pageSize: number, minPrice: string, maxPrice: string): Promise<number> {
        const self = this;
        return co(function* () {

            const db: mongo.Db = yield mongo.MongoClient.connect(self.uri);

            const collection: mongo.Collection = db.collection('items');

            const findQuery: {} = {};

            if (categoryCode) {
                findQuery['categoryCode'] = categoryCode;
            }

            if (minPrice && maxPrice) {
                findQuery['price'] = { $lte: parseFloat(maxPrice), $gte: parseFloat(minPrice) };
            } else if (minPrice) {
                findQuery['price'] = { $gte: parseFloat(minPrice) };
            } else if (maxPrice) {
                findQuery['price'] = { $lte: parseFloat(maxPrice) };
            }

            let items: Item[] = yield collection.find(findQuery).toArray();

            items = query? items.filter((x: Item) => self.filter(x, query)) : items;

            db.close();

            return Math.ceil(items.length / pageSize);
        });
    }

    private filter(item: Item, query: string): boolean {
        query = query.toLowerCase();

        const words: string[] = query.split(' ');

        let isInDescription = true;

        for (const word of words) {
            const rx = new RegExp(`${word}`);

            if (!rx.test(item.description.toLowerCase())) {
                isInDescription = false;
            }
        }

        let isInName = true;

        for (const word of words) {
            const rx = new RegExp(`${word}`);

            if (!rx.test(item.name.toLowerCase())) {
                isInName = false;
            }
        }

        return isInDescription || isInName;
    }
}