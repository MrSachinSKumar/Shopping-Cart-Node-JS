var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
var userHelpers=require('../helpers/user-helpers')

const verifyLogin=((req,res,next)=>
{
     if(req.session.userLoggedIn)
    {
      next()
    }else
    {
      res.redirect('/login')
    }
})

router.get('/',async function(req, res, next) 
{
  let user=req.session.user
  if(user)
  {
     let cartCount=await userHelpers.getCartCount(req.session.user._id)
     if(cartCount===0)
      {
         productHelpers.getAllProducts().then((products)=>
         {
        res.render('user/view-products',{admin:false,products,user})
         })
     }
     else
     {
       productHelpers.getAllProducts().then((products)=>
      {
        res.render('user/view-products',{admin:false,products,user,cartCount})
      })
    }
  }
  else
  {
    productHelpers.getAllProducts().then((products)=>
    {
      res.render('user/view-products',{admin:false,products})
    })
  }
});

router.get('/signup',(req, res)=> 
{
  res.render('user/signup',{admin:false})
});

router.post('/signup',(req, res)=>
{
  userHelpers.doSignup(req.body).then((response)=>
  {

    res.redirect('/login')
  })
});

router.get('/login',(req, res)=> 
{
  if(req.session.user)
  {
    res.redirect('/')
  }
  else
  {
    res.render('user/login',{'loginErr':req.session.userLoginErr,admin:false})
    req.session.userLoginErr=false
  }
});

router.post('/login',(req, res)=> 
{
  userHelpers.doLogin(req.body).then((response)=>
  {
     if(response.status)
    {
      req.session.user=response.user
      req.session.userLoggedIn=true
      res.redirect('/')
    }else{
      req.session.userLoginErr="Invalid Username or password"
      res.redirect('/login')
    }
  }).catch((response)=>
  {
    req.session.userLoginErr="User doesn't exists"
    res.redirect('/login')
  })
});

router.get('/logout',(req, res)=> 
{
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/login')
});

router.get('/add-to-cart/:id',(req, res)=> 
{
  userHelpers.addToCart(req.params.id,req.session.user._id)
  res.json({status:true})//goes to ajax function
});

router.get('/cart',verifyLogin,async(req, res)=> 
{
  let user=req.session.user
  let products=await userHelpers.getCartProducts(req.session.user._id)
  if(products.length>0)
  {
    let totalAmount=await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/cart',{admin:false,user,products,totalAmount})
  }else
  { 
    let totalAmount=0
    res.render('user/cart',{admin:false,user,products,totalAmount})
  }
});

router.post('/cart',verifyLogin,async(req, res)=> 
{
  let user=req.session.user
  res.redirect('/user/cart',{admin:false,user})
});

router.post('/change-product-quantity',verifyLogin,(req, res)=> 
{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>
  {
    response.totalAmount=await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
});

router.get('/place-order',verifyLogin,async(req, res)=> 
{
    let user=req.session.user
    let totalAmount=await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/place-order',{admin:false,user,totalAmount})
});

router.post('/place-order',async(req, res)=> 
{
  let cartProducts=await userHelpers.getCartProductsDetails(req.body.userId)
  userHelpers.placeOrder(req.body,cartProducts).then((orderId)=>
  {
    if(req.body['payment-method']==='COD')
    {
      res.json({codSuccess:true})
    }else
    {
      userHelpers.generateRazorpay(orderId,req.body.total).then((order)=>
      {
        console.log(order);
        res.json(order)
      })
    }
  })
})

router.get('/order-success',verifyLogin,(req,res)=>
{
  let user=req.session.user
  res.render('user/order-success',{admin:false,user})
})

router.get('/orders',verifyLogin,async(req, res)=> 
{
    let user=req.session.user
    let orderDetails=await userHelpers.getOrderDetails(req.session.user._id)
    res.render('user/orders',{admin:false,user,orderDetails})
});

router.get('/view-order-products/:id',verifyLogin,async(req, res)=> 
{
    let user=req.session.user
    let productDetails=await userHelpers.getOrderProductDetails(req.params.id)
    res.render('user/view-order-products',{admin:false,user,productDetails})
});

router.post('/verify-payment',(req, res)=> 
{
  userHelpers.verifyPayment(req.body).then(()=>
  {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>
    {
      res.json({status:true})
    })
  }).catch((err)=>
  {
    //console.log(err);
    res.json({status:false,errMsg:'Payment failed'})
  })
});

router.get('/profile',verifyLogin,async(req, res)=> 
{
  let user=req.session.user

  //let profileDetails=await userHelpers.getUsers(req.session.user._id)
  res.render('user/profile',{admin:false,user})
})

router.get('/update-details',verifyLogin,async(req, res)=> 
{
  let user=req.session.user
  res.render('user/update-details',{admin:false,user})
})

router.post('/update-details',async(req, res)=> 
{
  // console.log(req.body);
  userHelpers.updateDetails(req.body).then((response)=>
  {
    console.log(response);
    res.json(response)
   })
})

module.exports = router;