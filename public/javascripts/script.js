function AddToCart(proId)
{
    $.ajax
    ({
        url:'add-to-cart/'+proId,
        method:'get',
        success:(response)=>
        {
            if(response.status)
            {
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $('#cart-count').html(count)
            }
        }
    })
}

function changeQuantity(cartId,productId,userId,count)
{
    let quantity=parseInt(document.getElementById(productId).innerHTML)
    count=parseInt(count)
    $.ajax
    ({
        url:'/change-product-quantity',
        data:
        {
            cart:cartId,
            product:productId,
            user:userId,
            count:count,
            quantity:quantity
        },
        method:'post',
        success:(response)=>
        {
            if(response.removeProduct)
            {
                alert('Product removed from cart')
                location.reload()
            }else
            {
                document.getElementById(productId).innerHTML=quantity+count
                document.getElementById('total').innerHTML=response.totalAmount
            }
        }
    })
}

