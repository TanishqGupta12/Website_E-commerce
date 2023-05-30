const { getAllproduction , createProducts, updateproduction, deleteProducts, getProducts  } = require("../Controllers/production");

const { createProductionReview,getProductsReview  , deleteProductsReview} = require("../Controllers/production");

const {isAuthenticated , AuththorizRoles} = require("../middleware/isAuthenticated")
const router = require("express").Router()


router.route("/products").get(getAllproduction);

// create produvts  admin post 
router.route("/products/new").post(createProducts)

// router.route("/products/new").post(isAuthenticated,AuththorizRoles("admin")  ,createProducts)

//  delete
// update produvts  admin get
router.route("/admin/products/:id")
.put(isAuthenticated,AuththorizRoles("admin"), updateproduction)
.delete(isAuthenticated,AuththorizRoles("admin") ,deleteProducts)



router.route("/products/:id").get( getProducts);

router.route("/review")
.put( isAuthenticated, createProductionReview)


router.route("/reviews")
.get(getProductsReview).delete(isAuthenticated , deleteProductsReview)

module.exports = router