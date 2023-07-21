import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";

import Cart from "../components/Cart";
// import react-redux for useDisptach and useSelector
import { useDispatch, useSelector } from "react-redux";
import {
  REMOVE_FROM_CART,
  UPDATE_CART_QUANTITY,
  ADD_TO_CART,
  UPDATE_PRODUCTS,
} from "../utils/actions";
import { QUERY_PRODUCTS } from "../utils/queries";
import { idbPromise } from "../utils/helpers";
import spinner from "../assets/spinner.gif";

function Detail() {
  // create disptach from useDispatch()
  const dispatch = useDispatch();
  // create state object for useSelector() pass arrow function for selector value
  const state = useSelector((s) => s);

  const { id } = useParams();

  const [currentProduct, setCurrentProduct] = useState({ image: [] });

  const { loading, data } = useQuery(QUERY_PRODUCTS);

  const [currentImage, setCurrentImage] = useState(currentProduct.image[0]);

  const { products, cart } = state;

  const [currentSize, setCurrentSize] = useState("");
  
  const [listing, setListing] = useState("")

  const isCartItemMatch = (cartItem) => {
    return cartItem._id === currentProduct._id && cartItem.size === currentSize;
  };


//  const [quantityVisable, setQuantityVisible] = useState(false)

  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    // already in global store
    if (products.length) {
      const myProduct = products.find((product) => product._id === id);
      setCurrentProduct(myProduct);
      setCurrentImage(myProduct.image[0]);
    }
    // retrieved from server
    else if (data) {
      dispatch({
        type: UPDATE_PRODUCTS,
        products: data.products,
      });

      data.products.forEach((product) => {
        idbPromise("products", "put", product);
      });
    }
    // get cache from idb
    else if (!loading) {
      idbPromise("products", "get").then((indexedProducts) => {
        dispatch({
          type: UPDATE_PRODUCTS,
          products: indexedProducts,
        });
      });
    }
  }, [products, data, loading, dispatch, id]);

  const addToCart = () => {
    const itemInCart = cart.find(
      (cartItem) => cartItem._id === id && cartItem.size === currentSize
    );

    if (itemInCart) {
      dispatch({
        type: UPDATE_CART_QUANTITY,
        _id: id,
        size: currentSize,
        purchaseQuantity: parseInt(itemInCart.purchaseQuantity) + quantity,
      });
      idbPromise("cart", "put", {
        ...itemInCart,
        purchaseQuantity: parseInt(itemInCart.purchaseQuantity) + quantity,
      });
    } else {
      dispatch({
        type: ADD_TO_CART,
        product: { ...currentProduct, purchaseQuantity: quantity, size: currentSize },
      });
      idbPromise("cart", "put", { ...currentProduct, purchaseQuantity: quantity });
    }
  };

  const removeFromCart = () => {
    dispatch({
      type: REMOVE_FROM_CART,
      _id: currentProduct._id,
      size: currentSize
    });

    idbPromise("cart", "delete", { ...currentProduct });
  };

  const onChange = (e) => {
    const { value } = e.target;

    setQuantity(parseInt(value, 10));

    if (value === "0") {
      dispatch({
        type: REMOVE_FROM_CART,
        _id: currentProduct._id,
      });
      idbPromise("cart", "delete", { ...currentProduct });
    } else {
      dispatch({
        type: UPDATE_CART_QUANTITY,
        _id: currentProduct._id,
        purchaseQuantity: parseInt(value),
      });
      idbPromise("cart", "put", {
        ...currentProduct,
        purchaseQuantity: parseInt(value),
      });
    }
  };

  const onClick = (e) => {
    const value = e.target.id;
    console.log(value);
    

//    setQuantityVisible(!quantityVisable)
    setCurrentSize(value);
    setListing(`${value}-${currentProduct._id}`)


    idbPromise("cart", "put", {
      ...currentProduct,
      size: value,
      listing: listing
    });
  };
  return (
    <>
      {currentProduct && cart ? (
        <div className="container my-1">
          <div className="product">
            <div className="productLeft">
              <div className="images">
                {currentProduct.image.map((i) => (
                  <img
                    src={`/images/${i}`}
                    alt={i}
                    onClick={() => setCurrentImage(i)}
                  />
                ))}
                {/* <img
                  src={`/images/${currentProduct.image[0]}`}
                  alt={currentProduct.image[0]}
                />
                ; */}
              </div>
              <div className="mainimage">
                <img src={`/images/${currentImage}`} alt={currentImage} />
              </div>
            </div>
            <div className="productRight">
              <Link to="/">← Back to Products</Link>

              <h2>{currentProduct.name}</h2>

              <p>{currentProduct.description}</p>

              <p>
                <strong>Price:</strong>${currentProduct.price} <br />
                <br />
                {currentProduct?.category?.size?.map((s) => (
                  <button id={s} onClick={onClick}>
                    {s}
                  </button>
                ))}
                <br />
                <br />
                <input
//                  disabled={quantityVisable || cart.some((item) => item.listing === listing)}
                  type="number"
                  placeholder="1"
                  min = '1'
                  value = {quantity}
                  onChange={onChange}
                  
                />
                <br />
                <button 
                onClick={addToCart}>Add to Cart</button>
                <button
                    //! disabled is false if the cart item matches currentProduct
                    //! meaning it will display
                  disabled={!cart.some(isCartItemMatch)}
                  onClick={removeFromCart}
                >
                  Remove from Cart
                </button>
              </p>

              {/* <img
                src={`/images/${currentProduct.image}`}
                alt={currentProduct.name}
              /> */}
            </div>
          </div>
        </div>
      ) : null}
      {loading ? <img src={spinner} alt="loading" /> : null}
      <Cart />
    </>
  );
}

export default Detail;
