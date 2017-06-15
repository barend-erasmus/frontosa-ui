// Imports
import { Express, Request, Response } from "express";
import * as express from 'express';
import * as co from 'co';

// Imports services
import { ItemService } from './../services/item';

// Imports models
import { Category } from './../models/category';
import { Item } from './../models/item';

export class HomeRouter {

    public static index(req: Request, res: Response, next: () => void) {

        co(function* () {

            const itemService: ItemService = new ItemService('mongodb://mongo:27017/frontosa');
            const categories: Category[] = yield itemService.listCategories();

            res.render('home', {
                categoriesOne: categories.slice(0, 25),
                categoriesTwo: categories.slice(25, 50),
                categoriesThree: categories.slice(50, 75),
                categoriesFour: categories.slice(75)
            });
        });
    }

    public static category(req: Request, res: Response, next: () => void) {

        co(function* () {

            const categoryCode: string = req.query.code;
            const query: string = req.query.query;
            const pageSize: number = 10;
            const start: number = req.query.page ? req.query.page - 1 : 0;
            const minPrice = req.query.min;
            const maxPrice = req.query.max;

            const itemService: ItemService = new ItemService('mongodb://mongo:27017/frontosa');
            const category: Category = yield itemService.findCategory(categoryCode);
            const items: Item[] = yield itemService.listItems(categoryCode, query, 'name', start, pageSize, minPrice, maxPrice);
            const numberOfPages: number = yield itemService.numberOfPages(categoryCode, query, pageSize, minPrice, maxPrice);

            res.render('category', {
                query: query,
                category: category,
                items: items,
                pages: HomeRouter.getPages(numberOfPages).splice(start, 6),
                minPrice: minPrice,
                maxPrice: maxPrice
            });
        });
    }

    public static item(req: Request, res: Response, next: () => void) {

        co(function* () {
            const code: string = req.query.code;

            const itemService: ItemService = new ItemService('mongodb://mongo:27017/frontosa');
            const item: Item = yield itemService.findItem(code);

            res.render('item', {
                item: item,
            });
        });
    }

    private static getPages(numberOfPages: number): number[] {
        const arr = [];

        for (let i = 1; i < numberOfPages + 1; i++) {
            arr.push(i);
        }

        return arr;

    }

}
