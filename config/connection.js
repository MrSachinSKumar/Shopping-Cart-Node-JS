const mongoClient=require('mongodb').MongoClient

const state={
    db:null
}

module.exports.connect=function(callback)
{
    const url='mongodb://localhost:27017'
    const dbname='shopping_cart'
    mongoClient.connect(url,(err,client)=>
    {
        if(err)
        return callback(err)
        else
        state.db=client.db(dbname)
        callback()
    })
}

module.exports.get=function()
{
    return state.db
}