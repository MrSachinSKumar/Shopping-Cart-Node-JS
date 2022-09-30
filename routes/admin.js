var express = require('express');
var router = express.Router();
var adminHelpers=require('../helpers/admin-helpers')
var productHelpers=require('../helpers/product-helpers')
const fs = require('fs')

const verifyLogin=((req,res,next)=>
{
     if(req.session.adminLoggedIn)
    {
      next()
    }else
    {
      res.redirect('/admin/login')
    }
})

router.get('/', function(req, res, next) 
{
  let admin=req.session.admin
  if(admin)
  {
    productHelpers.getAllProducts().then((products)=>
    {
      res.render('admin/view-products',{admin:true,products,admin})
    })
  }else
  {
    res.redirect('/admin/login')
  }
});

router.get('/signup',(req, res)=> 
{
  res.render('admin/signup',{admin:true})
});

router.post('/signup',(req, res)=>
{
  adminHelpers.doSignup(req.body).then((response)=>
  {

    res.redirect('/admin/login')
  })
});

router.get('/login',(req, res)=> 
{
  if(req.session.admin)
  {
    res.render('admin/view-products',{admin:true})
  }
  else
  {
    res.render('admin/login',{'loginErr':req.session.adminLoginErr,admin:true})
    req.session.adminLoginErr=false
  }
});

router.post('/login',(req, res)=> 
{
  adminHelpers.doLogin(req.body).then((response)=>
  {
    if(response.status)
    {
      req.session.admin=response.admin
      req.session.adminLoggedIn=true
      res.redirect('/admin')
    }else{
      req.session.adminLoginErr="Invalid Username or password"
      res.redirect('/admin/login')
    }
  }).catch((response)=>
  {
    req.session.adminLoginErr="Admin doesn't exists"
    res.redirect('/admin/login')
  })
});

router.get('/logout',verifyLogin,(req, res)=> 
{
  req.session.admin=null
  req.session.adminLoggedIn=false
  res.redirect('/admin/login')
});

router.get('/add-product',verifyLogin,(req,res)=>
{
  let admin=req.session.admin
  res.render('admin/add-product',{admin:true,admin})
})

router.post('/add-product',verifyLogin,(req,res)=>
{
  productHelpers.addProduct(req.body,(id)=>
  {
    let admin=req.session.admin
    let image=req.files.image
    image.mv('./public/product-images/'+id+'.jpg',(err=>
    {
      if(!err)
      {
        res.render('admin/add-product',{admin:true,admin})
      }else
      {
        console.log(err)
      }
    }))     
    console.log(id)
  })
})

router.get('/delete-product/:id',verifyLogin,(req,res)=>
{
  let proId=req.params.id
  productHelpers.deleteProduct(proId).then((response)=>
  {
    const path = './public/product-images/'+proId+'.jpg'
      try 
      {
        fs.unlinkSync(path)
      } catch(err) 
      {
        console.error(err)
      }
      res.redirect('/admin')
  })
})

router.get('/edit-product/:id', verifyLogin,async(req,res)=>
{
  console.log(req.params.id);
  let admin=req.session.admin
  let product=await productHelpers.getProductDetails(req.params.id)
  {
    res.render('admin/edit-product',{product,admin:true,admin})
  }
})

router.post('/edit-product/:id', verifyLogin,(req,res)=>
{
  productHelpers.updateProduct(req.params.id,req.body).then(()=>
    {
      res.redirect('/admin')
      if(req.files.image)
      {
       let image=req.files.image
       image.mv('./public/product-images/'+req.params.id+'.jpg')
      }
    })
})

router.get('/orders', verifyLogin,async(req,res)=>
{
  let admin=req.session.admin
  let orderDetails=await adminHelpers.getOrderDetails()
  {
     res.render('admin/orders',{admin:true,admin,orderDetails})
  }
})
router.get('/view-order-products/:id',verifyLogin,async(req, res)=> 
{
    let admin=req.session.admin
    let productDetails=await adminHelpers.getOrderProductDetails(req.params.id)
    res.render('admin/view-order-products',{admin:true,admin,productDetails})
});

router.get('/users', verifyLogin,async(req,res)=>
{
  let admin=req.session.admin
  users=await adminHelpers.getUsers()
  res.render('admin/users',{admin:true,users,admin})
})

router.post('/change-order-status/:id',(req,res)=>
{
  adminHelpers.updateStatus(req.params.id).then((response)=>
  {
       res.json({updateStatus:true})
  })
})

module.exports = router;
