var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
var objectId=require('mongodb').ObjectId

module.exports={

    doSignup:(adminData)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            adminData.password=await bcrypt.hash(adminData.password,10) 
            db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData).then((data)=>
            {
                resolve(data.insertedId)
            })
        })
    },

    doLogin:(adminData)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let response={}
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({email:adminData.email})
            if(admin)
            {
                bcrypt.compare(adminData.password,admin.password).then((status)=>
                {
                    if(status)
                    {
    
                        response.admin=admin
                        response.status=true
                        resolve(response)
                    }else{
                        response.status=false
                        resolve(response)
                    }
                })
            }else
            {
                response.status=false
                reject(response)
            }
        })
    },
    getUsers:()=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    getOrderDetails:()=>
    {
    return new Promise(async(resolve,reject)=>
    {
        let orders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
        resolve(orders)
    })
},
getOrderProductDetails:(orderId)=>
{
    return new Promise(async(resolve,reject)=>
    {
        let productDetails=await db.get().collection(collection.ORDER_COLLECTION).aggregate
        ([
            {
                $match:{_id:objectId(orderId)}//got cart of the user
            },
            {
                $unwind:'$products'
            },
            {
                $project:
                {
                    item:'$products.item',
                    quantity:'$products.quantity'
                },
            },
            {
                $lookup:
                {
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:
                {
                    item:1,
                    quantity:1,
                    product:{$arrayElemAt:['$product',0]}
                }
            }
        ]).toArray()
        resolve(productDetails)
    })
},
updateStatus:(orderId)=>
{
    return new Promise((resolve,reject)=>
    {
        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
        {
            $set:{dispatch:'Shipped'}
        }).then((response)=>
        {
            resolve(response)
        })
    })
}

}