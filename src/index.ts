/**
 * graphql-dataloader-mongoose
 * Copyright (c) 2019-present NAVER Corp.
 * MIT license
 */
import { default as _ } from 'lodash';
import { Model, Document } from 'mongoose';
import { default as DataLoader } from 'dataloader';

type LoaderKey = string | number | symbol;
class MongooseDataloader<K extends LoaderKey, V extends Document> {
  private readonly mongooseModel: Model<V>;
  private readonly loaderMap: Map<K, DataLoader<K, V>>;

  constructor(mongooseModel: Model<V>) {
    this.mongooseModel = mongooseModel;
    this.loaderMap = new Map<K, DataLoader<K, V>>();
  }

  public dataloader(key: K) {
    const loader = this.loaderMap.get(key);

    if (loader) return loader;

    const newLoader = this.createLoader(key);
    this.loaderMap.set(key, newLoader);

    return newLoader;
  }

  private createLoader(key: K) {
    return new DataLoader<K, V>(ids =>
      this.mongooseModel.find({ [key]: { $in: ids } }).then(list => {
        const listByKey = _.keyBy(list, key);
        return ids.map(id => _.get(listByKey, id, null));
      }),
    );
  }
}

class MongooseDataloaderFactory {
  private readonly loaderMap: Map<string, MongooseDataloader<LoaderKey, any>>;

  constructor() {
    this.loaderMap = new Map<string, MongooseDataloader<LoaderKey, any>>();
  }

  mongooseLoader<T extends Document>(model: Model<T>): MongooseDataloader<LoaderKey, T> {
    const modelKey = model.modelName;
    const mongooseLoader = this.loaderMap.get(modelKey);

    if (mongooseLoader) return mongooseLoader;

    const newMongooseDataloader = new MongooseDataloader(model);
    this.loaderMap.set(modelKey, newMongooseDataloader);

    return newMongooseDataloader;
  }
}

export { MongooseDataloader, MongooseDataloaderFactory };
