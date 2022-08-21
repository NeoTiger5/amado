function addToCart(proId) {
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                Swal.fire(
                    'Good job!',
                    'Item Added to Cart!',
                    'success'
                  )
                count = parseInt(count) + 1
                $('#cart-count').html(count)
            }
            // alert(response)
        }
    })
}

function addToWishlist(proId) {
    $.ajax({
        url: '/add-to-wishlist/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#wish-count').html()
                Swal.fire(
                    'Good job!',
                    'Item Added to wishlist!',
                    'success'
                  )
                count = parseInt(count) + 1
                $('#wish-count').html(count)
            }
           
        }
    })
}

