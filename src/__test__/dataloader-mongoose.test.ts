import { Mongoose, Document, Model } from 'mongoose';
import { expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseDataloaderFactory } from '../index';

let mongoServer: MongoMemoryServer;
let mongoose: Mongoose;

before(done => {
  mongoServer = new MongoMemoryServer();
  mongoose = new Mongoose();

  mongoServer
    .getConnectionString()
    .then(mongoUri => {
      return mongoose.connect(mongoUri, { useNewUrlParser: true }, err => {
        if (err) done(err);
      });
    })
    .then(() => done());
});

after(() => {
  mongoose.disconnect();
  mongoServer.stop();
});
interface IUser {
  userId: string;
}

interface IUserModel extends IUser, Document {}

describe('MongooseDataloaderFactory', () => {
  let user: Model<IUserModel, {}>;

  before(() => {
    const { Schema } = mongoose;
    const userSchema = new Schema({ userId: String });
    user = mongoose.model<IUserModel>('user', userSchema);
  });

  it('same mongoose model, same MongooseDataloader', () => {
    const mongooseDataloaderFactory = new MongooseDataloaderFactory();
    const userMongooseDataloader1 = mongooseDataloaderFactory.mongooseLoader(user);
    const userMongooseDataloader2 = mongooseDataloaderFactory.mongooseLoader(user);

    expect(userMongooseDataloader1).to.equal(userMongooseDataloader2);
  });

  it('same mongoose model and key, same graphql dataloader', () => {
    const mongooseDataloaderFactory = new MongooseDataloaderFactory();
    const userMongooseDataloader = mongooseDataloaderFactory.mongooseLoader(user);

    const key = 'userId';
    const dataloader1 = userMongooseDataloader.dataloader(key);
    const dataloader2 = userMongooseDataloader.dataloader(key);

    expect(dataloader1).to.equal(dataloader2);
  });

  it('dataloader works as expected', async () => {
    const selectkey = 'userId';
    const mongooseDataloaderFactory = new MongooseDataloaderFactory();
    const dataloader = mongooseDataloaderFactory.mongooseLoader(user).dataloader(selectkey);

    const testUserId1 = 'testUser1';
    const testUserId2 = 'testUser2';
    const testUserId3 = 'testUser3';

    user.create({ userId: testUserId1 });
    user.create({ userId: testUserId2 });
    user.create({ userId: testUserId3 });

    const testData1 = await dataloader.load(testUserId1);
    const testData2 = await dataloader.load(testUserId2);
    const testData3 = await dataloader.load(testUserId3);

    expect(testData1.userId).is.equal(testUserId1);
    expect(testData2.userId).is.equal(testUserId2);
    expect(testData3.userId).is.equal(testUserId3);
  });
});
