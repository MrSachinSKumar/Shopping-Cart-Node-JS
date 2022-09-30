var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
var objectId=require('mongodb').ObjectId
const Razorpay = require('razorpay');

var instance = new Razorpay
({
    key_id: 'rzp_test_9PECXmjzvqJYzo',
    key_secret: '8EPbsaIcepJ2S5ijj5vdpmmp',
});

module.exports={

doSignup:(userData)=>
{
    return new Promise(async(resolve,reject)=>
    {
        userData.password=await bcrypt.hash(userData.password,10) 
        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>
        {
            resolve(data.insertedId)
        })
    })
},
doLogin:(userData)=>
{
    return new Promise(async(resolve,reject)=>
    {
        let response={}
        let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
        if(user)
        {
            bcrypt.compare(userData.password,user.password).then((status)=>
            {
                if(status)
                {

                    response.user=user
                    response.status=true
                    resolve(response)
                }else{
                    response.status=false
                    resolve(response)
                }
            })

            // if(userData.password===user.password)
            // {
            //     response.user=user
            //         response.status=true
            //         resolve(response)
            // }
        }else
        {
            response.status=false
            reject(response)
        }
    })
},
addToCart:(proId,userId)=>
{
    let prodObj=
        {
            item:objectId(proId),
            quantity:1
        }
    return new Promise(async(resolve,reject)=>
    {
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(userCart)
        {
            let ProdExist=userCart.products.findIndex(products=>products.item==proId)
            if(ProdExist!=-1)
            {
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then(()=>resolve())
            }
            else
            {
            db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
            {
                $push:{products:prodObj}
            }
            ).then(()=>{resolve()})
        }
    }
    else
    {
    let cartObj=
    {
        user:objectId(userId),
        products:[prodObj]
    }
    db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(()=>resolve())
}
})
},
getCartProducts:(userId)=>
{
    return new Promise(async(resolve,reject)=>
    {
        let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate
        ([
            {
                $match:{user:objectId(userId)}
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
        resolve(cartItems)
    })
},
getCartCount:(userId)=>
{
    return new Promise(async(resolve,reject)=>
    {
         let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
       if(cart==null)
        {
             let count=0
             resolve(count)
        }else
        {
            count=await db.get().collection(collection.CART_COLLECTION).aggregate
             ([
                 {$match:{user:objectId(userId)}},
                 {$unwind:'$products'},
                 {$group:
                     {
                         _id:null,
                         'count':{$sum:'$products.quantity'}
                     }
                 },
             ]).toArray()
             console.log(count[0].count);
             resolve(count[0].count) 
         }
    })
},
changeProductQuantity:(details)=>
{
    details.count=parseInt(details.count)
    details.quantity=parseInt(details.quantity)
    return new Promise(async(resolve,reject)=>
    {
        count=await db.get().collection(collection.CART_COLLECTION).aggregate
         ([
             {$match:{user:objectId(details.user)}},
             {$unwind:'$products'},
             {$group:
                 {
                     _id:null,
                     'count':{$sum:'$products.quantity'}
                 }
             },
             {$project:
                {
                    _id:0,
                    count:1
                }}
        ]).toArray()

        if(details.count==-1 && details.quantity==1 && count[0].count==1)
        {
            db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(details.user)}).then((response)=>
            {
                resolve({removeProduct:true})
            })
        }
        else if(details.count==-1 && details.quantity==1)
        {
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(details.product)}}
            }
            ).then((response)=>
            {
                resolve({removeProduct:true})
            })
        }
        else
        {
            db.get().collection(collection.CART_COLLECTION)
        .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
        {
            $inc:{'products.$.quantity':details.count}
        }
        ).then((response)=>
        {
            resolve({removeProduct:false})
        })
        }
        
    })
},
getTotalAmount:(userId)=>
{
    return new Promise(async(resolve,reject)=>
    {
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(cart==null)
        {
            let total=0
            resolve(total)
        }
        else
        {
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate
            ([
                {
                    $match:{user:objectId(userId)}
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
                },
                {
                    $group:
                    {
                        _id:null,
                        total:{$sum:{$multiply:["$quantity",{$toInt:'$product.price'}]}}
                    }
                }
            ]).toArray()
            resolve(total[0].total) 
        }
    })
},

getCartProductsDetails:(userId)=>
{
    return new Promise(async(resolve,reject)=>
    {
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        resolve(cart.products)
    })
},

placeOrder:(orderDetails,productDetails)=>
{
    return new Promise(async(resolve,reject)=>
    {
        let status=orderDetails['payment-method']==='COD'?'Placed':'Pending'
        let orderObj={
            deliveryDetails:
            {
                name:orderDetails.address,
                address:orderDetails.address,
                mobile:orderDetails.mobile,
                pincode:orderDetails.pincode,
                area:orderDetails.area,
                landmark:orderDetails. landmark,
                city:orderDetails. city,
                state:orderDetails.state,
            },
            userId:objectId(orderDetails.userId),
            products:productDetails,
            total:orderDetails.total,
            paymentMethod:orderDetails['payment-method'],
            status:status,
            date:new Date(),
            dispatch:'Not shipped'
        }
        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>
        {
            db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(orderDetails.userId)})
            resolve(response.insertedId)
        })
    })
},
getOrderDetails:(userId)=>
{
    return new Promise(async(resolve,reject)=>
    {
        let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
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
                $match:{_id:objectId(orderId)}
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
generateRazorpay:(orderId,total)=>
{
        return new Promise((resolve,reject)=>
        {
            var options = {
                amount: total*100,
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) 
              {
                if(err)
                {
                    console.log(err)
                }else
                {
                    console.log(order);
                    resolve(order)
                }
              });
        })
},
verifyPayment:(details)=>
{
    return new Promise((resolve,reject)=>
    {
        const crypto =require('crypto')
        let hmac =crypto.createHmac('sha256','8EPbsaIcepJ2S5ijj5vdpmmp')
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
        hmac=hmac.digest('hex')
        if(hmac==details['payment[razorpay_signature]'])
        {
            resolve()
        }else
        {
            reject()
        }
    })
},
changePaymentStatus:(orderId)=>
{
    return new Promise((resolve,reject)=>
    {
        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
        {
            $set:{status:'Placed'}
        }).then(()=>
        {
            resolve()
        })
    }
)},
getUsers:(userId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let user=await db.get().collection(collection.USER_COLLECTION).find({_id:objectId(userId)}).toArray()
            resolve(user)
        })
    },

updateDetails:(userDetails)=>
{
    console.log(userDetails);
    return new Promise(async(resolve,reject)=>
    {
        let response={}
        let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userDetails._id)})
        if(user)
        {    
            userDetails.newPassword= await bcrypt.hash(userDetails.newPassword,10) 
            bcrypt.compare(userDetails.oldPassword,user.password).then((status)=>
            {
                if(status)
                {
                    db.get().collection(collection.USER_COLLECTION)
                    .updateOne({_id:objectId(userDetails._id)},
                    {
                        $set:
                        {
                            name:userDetails.name,
                            email:userDetails.email,
                            password:userDetails.newPassword,
                        }
                    })
                        response.status=true
                        resolve(response)
                }
                else
                {
                    response.status=false
                    resolve(response)
                }
            })

            // if(userDetails.oldPassword===user.password)
            // {
            //     db.get().collection(collection.USER_COLLECTION)
            //         .updateOne({_id:objectId(userDetails._id)},
            //         {
            //             $set:
            //             {
            //                 name:userDetails.name,
            //                 email:userDetails.email,
            //                 password:userDetails.newPassword,
            //             }
            //         })
            //             response.status=true
            //             resolve(response)
            // }
            // else
            // {
            //         response.status=false
            //         resolve(response)
            // }
        }
    })
},

}
