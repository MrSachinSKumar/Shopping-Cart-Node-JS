var db=require('../config/connection')
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectId

module.exports={
    addProduct:(product,callback)=>
    {
        db.get().collection('product').insertOne(product).then((result)=>
        {
            callback(result.insertedId)
        })
    },
    getAllProducts:()=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            {
                resolve(products)
            }
        })
    },
    deleteProduct:(proId)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>
            {
                resolve(response)
            })
        })
    },
    getProductDetails:(proId)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>
            {
                resolve(product)
            })
        })
    },
    updateProduct:(proId,product)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(proId)},
            {
                $set:
                {
                    name:product.name,
                    category:product.category,
                    price:product.price,
                    description:product.description
                }}
                ).then((response)=>{resolve(response)
            })
        })
    },
}