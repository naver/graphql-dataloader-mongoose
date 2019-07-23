# Intro
graphql-dataloader-mongoose is a DataLoader generator library that creates a new `DataLoader` based on an existing Mongoose model with a single line of code!

# Installation
`npm install graphql-dataloader-mongoose`

# Getting Started

## Step 1 : Create a new `MongooseDataloaderFactory`
 
```es6
var DataLoader = require('graphql-dataloader-mongoose')

var dataloaderFactory = new MongooseDataloaderFactory();
```

Start by creating a new `MongooseDataloaderFactory`.
`MongooseDataloaderFactory` can create a Mongoose DataLoader instance dynamically while the application is running.
The instance can then create any DataLoader related to a designated Mongoose model (to be explained in detail below).

## Step 2 : Create Mongoose Model DataLoader

For example, here is a Mongoose model representing a `User` collection in a MongoDB instance.

```es6
var UserModel = mongoose.model('User', new Schema({ userId: String, name: String})
```

You can create a DataLoader which can fetch user data by a `userId` key.

```es6
var userIdDataloader = dataloaderFactory.mongooseLoader(UserModel).dataloader('userId');
```

Let's see how it works in detail!


### Mongoose Model Dataloader 
We create a Mongoose DataLoader instance by passing `UserModel` into `dataloaderFactory.mongooseLoader()`.
Then, we can create any DataLoader derived from the `UserModel` key.

```es6
var userMongooseDataloader = dataloaderFactory.mongooseLoader(UserModel);
```

### DataLoader
To use a DataLoader which selects data using the `userId` key,
all you need to do is pass the key to `MongooseDataloader.dataloader()`.

```es6
var userIdDataloader = userMongooseDataloader.dataloader('userId');
```

In this example, `userIdDataloader` can load data from the `User` collection,
using `userId` parameters in `userIdDataloader.load()` or `userIdDataloader.loadMany()`.

For more information on DataLoader functions and usage, please refer to https://github.com/graphql/dataloader#batch-function.




The code for `userIdDataloader` is roughly equivalent to the following: 


```es6
var userIdDataloader = new DataLoader(ids =>
  this.userModel.find({ userId: { $in: ids } }).then(list => {
    var listByKey = _.keyBy(list, key);
    return ids.map(id => _.get(listByKey, id, null));
  }),
);
```

If you need another DataLoader that selects data from `UserModel` using a different key, e.g. `_id`, just pass `_id` instead of `userId` to `userDataloader.dataloader()`.

```es6
var userPkDataloader = userDataloader.dataloader('_id');
```



If you want to keep the code simple as possible, you can chain everything in a single line of code:

```es6
var userIdDataloader = dataloaderFactory.mongooseLoader(UserModel).dataloader('userId');
```

## Step 3 : Just load it
just call ``load()`` or ``loadMany()`` just like you use the original DataLoader.

```es6
var userIds = ['John', 'Min', 'Lark'];
userIdDataloader.load(userIds).then(user => console.log(user.name));
```

# Use With
## Apollo Server
`graphql-dataloader-mongoose` integrates well with Apollo Server.
To use with Apollo Server, pass a `MongooseDataLoaderFactory` instance to the Apollo context when you initialize `ApolloServer`.
 
⚠️ You must pass a new `MongooseDataloaderFactory()` to the context function in the configuration parameters for `ApolloServer`, because a new DataLoader should be created in every HTTP request. (See Caveats)

```es6
var apolloServer = new ApolloServer( {
  schema: yourSchema,
  context: async ctx => {
    var dataloaderFactory = new MongooseDataloaderFactory();
    return { ...ctx, dataloaderFactory };
  },
})
```


Then, in the resolver function, you can use the `MongooseDataLoaderFactory` instance assigned in Apollo context:


```es6
Query: {
  resolveUserById(parent, param, context) {
    var userIds = param.userIds;
    var dataloaderFactory = context.dataloaderFactory;
    var userIdDataloader = dataloaderFactory.mongooseLoader(userModel).dataloader('userId');

    return userIdDataloader.loadMany(userIds);    
  }
}
```

## TypeScript
`graphql-dataloader-mongoose` is a TypeScript-based library.
Projects using TypeScript can easily incorporate it into their existing type system.

For example, suppose `UserModel` has `IUserModel` as an interface.

```ts
interface IUser {
  userId: string;
  name: string;
}

interface IUserModel extends IUser, Document {}

const UserModel = mongoose.model<IUserModel>(
  'User',
  new Schema({ userId: String, name: String }),
);
```

You can create a DataLoader by passing the interface, a la
`dataloaderFactory.mongooseLoader<IUserModel>`.

```ts
const userId = 'John';
const dataloaderFactory = new MongooseDataloaderFactory();

// assign IUserModel interface in mongooseLoader function generic type
const userIdDataloader = dataloaderFactory
  .mongooseLoader<IUserModel>(userModel)
  .dataloader('userId');

// able to typecheck user model attribute (name, userId ..)
const user = userIdDataloader.load(userId);
```


# Caveats
## Creating a DataLoader per request
You must always create a new `MongooseDataloaderFactory()` in every request. It is insufficient to set an instance as a global variable.
Pleas refer to https://github.com/graphql/dataloader#creating-a-new-dataloader-per-request for more details.
 
## Available query types
Currently,  `graphql-dataloader-mongoose` only supports finding by key (`find( key : { $in : ids}}`)
Support for other queries will be added soon.

# License

```
MIT License

Copyright (c) 2019-present NAVER Corp.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
