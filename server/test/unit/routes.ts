import * as CODES from 'http-codes';
import * as supertest from 'supertest';
import { suite, test } from 'mocha-typescript';
import { expect } from 'chai';
import { request, clearDb } from '../fixtures/server';
import { Playground } from '../../src/models/Playground';
import { IPlayground } from '../../../shared/types';

const testPlaygroundData: IPlayground = {
    slug: 'dBvJIh-H',
    name: 'test',
    contents: 'STUFF!',
    author: 'Chad Engler',
    pixiVersion: 'v5.0.0',
};

function createPlayground()
{
    return (new Playground(testPlaygroundData)).save();
}

@suite('Read Routes')
class ReadRoutes
{
    static before()
    {
        return clearDb().then(() => createPlayground());
    }

    @test 'GET health API should return 200'()
    {
        return request.get('/api/health')
            .expect(CODES.OK);
    }

    @test 'GET without version should return version 0'()
    {
        return request.get(`/api/${testPlaygroundData.slug}`)
            .expect(CODES.OK)
            .expect(confirmPlaygroundData());
    }

    @test 'GET with version should return proper data'()
    {
        return request.get(`/api/${testPlaygroundData.slug}/0`)
            .expect(CODES.OK)
            .expect(confirmPlaygroundData());
    }
}

@suite('Read Route Errors')
class ReadRouteErrors
{
    static before()
    {
        return clearDb();
    }

    @test 'GET non-existant slug should return 404'()
    {
        return request.get('/api/nope')
            .expect(CODES.NOT_FOUND);
    }

    @test 'GET invalid version should return 422'()
    {
        return request.get(`/api/${testPlaygroundData.slug}/nope`)
            .expect(CODES.UNPROCESSABLE_ENTITY);
    }

    @test 'GET non-existant version should return 404'()
    {
        return request.get(`/api/${testPlaygroundData.slug}/100`)
            .expect(CODES.NOT_FOUND);
    }

    @test 'GET non-existant slug/version should return 404'()
    {
        return request.get(`/api/nope/100`)
            .expect(CODES.NOT_FOUND);
    }
}

@suite('Write Routes')
class WriteRoutes
{
    static before()
    {
        return clearDb().then(() => createPlayground());
    }

    @test 'POST root creates a new playground'()
    {
        return request.post('/api')
            .send({ ...testPlaygroundData })
            .expect(CODES.OK)
            .expect(confirmPlaygroundData(null))
            .then((res) =>
            {
                const item = res.body.item;

                return request.get(`/api/${item.slug}/${item.version}`)
                    .expect(CODES.OK)
                    .expect(confirmPlaygroundData(null));
            });
    }

    @test 'POST with slug creates a new playground version'()
    {
        return request.post(`/api/${testPlaygroundData.slug}`)
            .send({ ...testPlaygroundData })
            .expect(CODES.OK)
            .expect(confirmPlaygroundData(testPlaygroundData.slug, 1))
            .then((res) =>
            {
                const item = res.body.item;

                return request.get(`/api/${item.slug}/${item.version}`)
                    .expect(CODES.OK)
                    .expect(confirmPlaygroundData(testPlaygroundData.slug, 1));
            });
    }
}

@suite('Write Route Errors')
class WriteRouteErrors
{
    static before()
    {
        return clearDb().then(() => createPlayground());
    }

    @test 'POST without name returns 422'()
    {
        const testData = { ...testPlaygroundData };

        delete testData.name;

        return request.post('/api')
            .send(testData)
            .expect(CODES.UNPROCESSABLE_ENTITY);
    }

    @test 'POST without author returns 422'()
    {
        const testData = { ...testPlaygroundData };

        delete testData.author;

        return request.post('/api')
            .send(testData)
            .expect(CODES.UNPROCESSABLE_ENTITY);
    }

    @test 'POST without contents returns 422'()
    {
        return request.post('/api')
            .send(testPlaygroundData)
            .expect(CODES.UNPROCESSABLE_ENTITY);
    }

    @test 'POST with slug, and without name returns 422'()
    {
        const testData = { ...testPlaygroundData };

        delete testData.name;

        return request.post('/api/nope')
            .send(testData)
            .expect(CODES.UNPROCESSABLE_ENTITY);
    }

    @test 'POST with slug, and without author returns 422'()
    {
        const testData = { ...testPlaygroundData };

        delete testData.author;

        return request.post('/api/nope')
            .send(testData)
            .expect(CODES.UNPROCESSABLE_ENTITY);
    }

    @test 'POST with slug, and without contents returns 422'()
    {
        return request.post('/api/nope')
            .send(testPlaygroundData)
            .expect(CODES.UNPROCESSABLE_ENTITY);
    }
}

function confirmPlaygroundData(slug: string = testPlaygroundData.slug, version: number = 0)
{
    return (res: supertest.Response) =>
    {
        const item = res.body.item;

        expect(item).to.have.property('id').that.is.a('number');
        expect(item).to.have.property('slug', slug !== null ? slug : res.body.item.slug);
        expect(item).to.have.property('name', testPlaygroundData.name);
        expect(item).to.have.property('description', '');
        expect(item).to.have.property('contents', testPlaygroundData.contents);
        expect(item).to.have.property('author', testPlaygroundData.author);
        expect(item).to.have.property('versionsCount', version);
        expect(item).to.have.property('starCount', 0);
        expect(item).to.have.property('pixiVersion', testPlaygroundData.pixiVersion);
        expect(item).to.have.property('isPublic', true);
        expect(item).to.have.property('isFeatured', false);
        expect(item).to.have.property('isOfficial', false);
        expect(item).to.have.property('createdAt').that.is.a('string');
        expect(item).to.have.property('updatedAt').that.is.a('string');
    };
}
