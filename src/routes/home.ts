// Imports
import { Express, Request, Response } from "express";
import * as express from 'express';
import * as co from 'co';

// Imports services
import { ItemService } from './../services/item';

// Imports models
import { Category } from './../models/category';

export class HomeRouter {

    public static index(req: Request, res: Response, next: () => void) {

        co(function* () {

            const itemService: ItemService = new ItemService('mongodb://mongo:27017/frontosa');
            const categories: Category[] = yield itemService.listCategories();

            res.render('home', {
                categoriesOne: categories.slice(0, 20),
                categoriesTwo: categories.slice(20, 40),
                categoriesThree: categories.slice(40, 60),
                categoriesFour: categories.slice(60)
            });
        });
    }

}
